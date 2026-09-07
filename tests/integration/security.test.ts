/**
 * Integration tests for the security invariants that only a real database can
 * prove: RLS, atomic credit deduction, concurrent spending, and webhook
 * idempotency.
 *
 * These run against a live Supabase project with the migrations applied. They
 * skip themselves when credentials are absent so `npm test` stays green in a
 * plain checkout.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   npm test
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const configured = Boolean(url && anonKey && serviceKey);
const suite = configured ? describe : describe.skip;

const password = "test-password-8chars!";

interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient;
}

suite("security invariants (live database)", () => {
  let admin: SupabaseClient;
  let alice: TestUser;
  let bob: TestUser;
  let aliceGenerationId: string;
  /** Users created inline by a test, deleted in afterAll like alice and bob. */
  const throwaway: string[] = [];

  async function balanceOf(userId: string): Promise<number> {
    const { data } = await admin
      .from("credit_balances")
      .select("balance")
      .eq("user_id", userId)
      .single();
    return data!.balance;
  }

  async function makeUser(label: string): Promise<TestUser> {
    const email = `oply-test-${label}-${Date.now()}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("could not create user");

    const client = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;

    return { id: data.user.id, email, client };
  }

  beforeAll(async () => {
    admin = createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    alice = await makeUser("alice");
    bob = await makeUser("bob");

    // Give Alice a known balance and one generation to test against.
    await admin
      .from("credit_balances")
      .update({ balance: 1000 })
      .eq("user_id", alice.id);

    const { data: generation } = await admin
      .from("ai_generations")
      .insert({
        user_id: alice.id,
        tool_slug: "ai-writer",
        tool_name: "AI Writer",
        input: { topic: "alice private topic" },
        input_preview: "alice private topic",
        output_text: "ALICE PRIVATE OUTPUT",
        credits_used: 20,
        status: "completed",
      })
      .select("id")
      .single();

    aliceGenerationId = generation!.id;
  }, 60_000);

  afterAll(async () => {
    if (!configured) return;
    for (const user of [alice, bob]) {
      if (user?.id) await admin.auth.admin.deleteUser(user.id);
    }
    for (const id of throwaway) {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    }
  }, 60_000);

  /* -------------------------------------------------------------- RLS */

  it("provisions a profile and balance on signup", async () => {
    const { data } = await alice.client
      .from("profiles")
      .select("id, role")
      .eq("id", alice.id)
      .single();

    expect(data?.id).toBe(alice.id);
    expect(data?.role).toBe("user");
  });

  it("stops a user reading another user's generation", async () => {
    const { data } = await bob.client
      .from("ai_generations")
      .select("id, output_text")
      .eq("id", aliceGenerationId);

    expect(data ?? []).toHaveLength(0);
  });

  it("stops a user deleting another user's generation", async () => {
    await bob.client.from("ai_generations").delete().eq("id", aliceGenerationId);

    const { data } = await admin
      .from("ai_generations")
      .select("id")
      .eq("id", aliceGenerationId);
    expect(data).toHaveLength(1);
  });

  it("stops a user giving themselves credits", async () => {
    const { error } = await bob.client
      .from("credit_balances")
      .update({ balance: 999_999 })
      .eq("user_id", bob.id);

    const { data } = await admin
      .from("credit_balances")
      .select("balance")
      .eq("user_id", bob.id)
      .single();

    // Either the write is rejected outright, or it matches no rows — never
    // does the balance actually change.
    expect(error ?? data!.balance).not.toBe(999_999);
    expect(data!.balance).toBeLessThan(999_999);
  });

  it("stops a user inserting their own credit transaction", async () => {
    const { error } = await bob.client.from("credit_transactions").insert({
      user_id: bob.id,
      type: "purchase",
      amount: 50_000,
      balance_after: 50_000,
    });
    expect(error).not.toBeNull();
  });

  it("stops a user reading another user's credit transactions", async () => {
    const { data } = await bob.client
      .from("credit_transactions")
      .select("id")
      .eq("user_id", alice.id);
    expect(data ?? []).toHaveLength(0);
  });

  /* ------------------------------------------- signup metadata sanitising */

  /**
   * `options.data` on signUp becomes `raw_user_meta_data`, and the anon key is
   * public — so these values are attacker-controlled, not form-controlled.
   * `handle_new_user()` has to sanitise them, because it is the one write path
   * into `profiles` that does not go through `profileSchema`.
   */
  async function signUpWithMetadata(
    label: string,
    metadata: Record<string, unknown>,
  ) {
    const email = `oply-test-${label}-${Date.now()}@example.com`;
    const anon = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anon.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error || !data.user) throw error ?? new Error("signup failed");
    throwaway.push(data.user.id);

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", data.user.id)
      .single();
    return profile!;
  }

  it("truncates an oversized full_name supplied at signup", async () => {
    const profile = await signUpWithMetadata("longname", {
      full_name: "A".repeat(5_000),
    });

    expect(profile.full_name).not.toBeNull();
    expect(profile.full_name!.length).toBeLessThanOrEqual(120);
  }, 30_000);

  it("strips control characters from a full_name supplied at signup", async () => {
    const profile = await signUpWithMetadata("ctrlname", {
      full_name: "Oply Support\n\nAccount verified",
    });

    expect(profile.full_name).not.toMatch(/[\r\n\t]/);
  }, 30_000);

  it("discards a non-URL avatar_url supplied at signup", async () => {
    const profile = await signUpWithMetadata("badavatar", {
      avatar_url: "javascript:alert(1)",
    });

    expect(profile.avatar_url).toBeNull();
  }, 30_000);

  it("discards an oversized avatar_url supplied at signup", async () => {
    const profile = await signUpWithMetadata("longavatar", {
      avatar_url: `https://example.com/${"a".repeat(5_000)}.png`,
    });

    expect(profile.avatar_url).toBeNull();
  }, 30_000);

  it("keeps a legitimate https avatar_url supplied at signup", async () => {
    const profile = await signUpWithMetadata("okavatar", {
      full_name: "Ada Lovelace",
      avatar_url: "https://example.com/ada.png",
    });

    expect(profile.full_name).toBe("Ada Lovelace");
    expect(profile.avatar_url).toBe("https://example.com/ada.png");
  }, 30_000);

  it("stops a user writing an oversized full_name directly", async () => {
    await bob.client
      .from("profiles")
      .update({ full_name: "B".repeat(5_000) })
      .eq("id", bob.id);

    const { data } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", bob.id)
      .single();
    expect((data!.full_name ?? "").length).toBeLessThanOrEqual(120);
  });

  it("stops a user writing a non-URL avatar_url directly", async () => {
    await bob.client
      .from("profiles")
      .update({ avatar_url: "javascript:alert(1)" })
      .eq("id", bob.id);

    const { data } = await admin
      .from("profiles")
      .select("avatar_url")
      .eq("id", bob.id)
      .single();
    expect(data!.avatar_url).not.toBe("javascript:alert(1)");
  });

  /* --------------------------------------------------------- referrals */

  it("stops a user inserting their own referral", async () => {
    const { error } = await bob.client.from("referrals").insert({
      referrer_id: bob.id,
      referred_id: alice.id,
    });
    expect(error).not.toBeNull();
  });

  it("stops a user granting themselves a referral reward", async () => {
    const { data: referral } = await admin
      .from("referrals")
      .select("id")
      .limit(1)
      .maybeSingle();

    const { error } = await bob.client.from("referral_rewards").insert({
      referral_id: referral?.id ?? crypto.randomUUID(),
      user_id: bob.id,
      credits: 100_000,
    });
    expect(error).not.toBeNull();
  });

  it("stops a user issuing themselves a referral code", async () => {
    const { error } = await bob.client
      .from("referral_codes")
      .insert({ user_id: bob.id, code: "HACKED11" });
    expect(error).not.toBeNull();
  });

  it("refuses a self-referral", async () => {
    const code = `SELF${Date.now().toString().slice(-4)}`.toUpperCase();
    await admin.from("referral_codes").insert({ user_id: bob.id, code });

    const { data } = await admin.rpc("attach_referral", {
      p_referred_id: bob.id,
      p_code: code,
    });
    expect(data).toBe(false);

    const { data: rows } = await admin
      .from("referrals")
      .select("id")
      .eq("referred_id", bob.id);
    expect(rows ?? []).toHaveLength(0);
  });

  it("refuses an unknown referral code", async () => {
    const { data } = await admin.rpc("attach_referral", {
      p_referred_id: bob.id,
      p_code: "NOSUCH11",
    });
    expect(data).toBe(false);
  });

  it("attributes a valid code exactly once, first touch winning", async () => {
    const first = `AAAA${Date.now().toString().slice(-4)}`.toUpperCase();
    const second = `BBBB${Date.now().toString().slice(-4)}`.toUpperCase();
    await admin.from("referral_codes").insert([
      { user_id: alice.id, code: first },
      { user_id: bob.id, code: second },
    ]);

    const referred = await makeUser("referred");
    throwaway.push(referred.id);

    const { data: attached } = await admin.rpc("attach_referral", {
      p_referred_id: referred.id,
      p_code: first,
    });
    expect(attached).toBe(true);

    // A second link must not re-attribute an account that already has one.
    const { data: again } = await admin.rpc("attach_referral", {
      p_referred_id: referred.id,
      p_code: second,
    });
    expect(again).toBe(false);

    const { data: rows } = await admin
      .from("referrals")
      .select("referrer_id")
      .eq("referred_id", referred.id);
    expect(rows).toHaveLength(1);
    expect(rows![0].referrer_id).toBe(alice.id);
  }, 30_000);

  it("pays the referrer once on a first order, and claws it back on refund", async () => {
    const code = `CCCC${Date.now().toString().slice(-4)}`.toUpperCase();
    await admin.from("referral_codes").insert({ user_id: alice.id, code });

    const referred = await makeUser("buyer");
    throwaway.push(referred.id);
    await admin.rpc("attach_referral", {
      p_referred_id: referred.id,
      p_code: code,
    });

    const reward = 500;
    await admin
      .from("site_settings")
      .upsert({ key: "referral_reward_credits", value: reward });

    const before = await balanceOf(alice.id);

    async function completeOrder() {
      const { data: order } = await admin
        .from("orders")
        .insert({
          user_id: referred.id,
          plan_id: "starter",
          plan_name: "Starter",
          amount: 9,
          currency: "USD",
          credits: 500,
          status: "pending",
          payment_provider: "dev",
        })
        .select("id")
        .single();
      await admin.rpc("complete_order_and_credit", { p_order_id: order!.id });
      return order!.id;
    }

    const firstOrder = await completeOrder();
    expect(await balanceOf(alice.id)).toBe(before + reward);

    // A second purchase by the same person must not pay again.
    await completeOrder();
    expect(await balanceOf(alice.id)).toBe(before + reward);

    // Reversing the qualifying order takes the reward back.
    await admin.rpc("refund_order", { p_order_id: firstOrder });
    expect(await balanceOf(alice.id)).toBe(before);

    const { data: referral } = await admin
      .from("referrals")
      .select("qualified_at")
      .eq("referred_id", referred.id)
      .single();
    expect(referral!.qualified_at).toBeNull();
  }, 60_000);

  it("never lets a referral clawback push a balance negative", async () => {
    const code = `DDDD${Date.now().toString().slice(-4)}`.toUpperCase();
    const referrer = await makeUser("poorreferrer");
    throwaway.push(referrer.id);
    await admin.from("referral_codes").insert({ user_id: referrer.id, code });

    const referred = await makeUser("buyer2");
    throwaway.push(referred.id);
    await admin.rpc("attach_referral", {
      p_referred_id: referred.id,
      p_code: code,
    });

    const { data: order } = await admin
      .from("orders")
      .insert({
        user_id: referred.id,
        plan_id: "starter",
        plan_name: "Starter",
        amount: 9,
        currency: "USD",
        credits: 500,
        status: "pending",
        payment_provider: "dev",
      })
      .select("id")
      .single();
    await admin.rpc("complete_order_and_credit", { p_order_id: order!.id });

    // Referrer spends everything before the refund lands.
    await admin
      .from("credit_balances")
      .update({ balance: 0 })
      .eq("user_id", referrer.id);

    await admin.rpc("refund_order", { p_order_id: order!.id });
    expect(await balanceOf(referrer.id)).toBe(0);
  }, 60_000);

  it("stops a user promoting themselves to admin", async () => {
    await bob.client.from("profiles").update({ role: "admin" }).eq("id", bob.id);

    const { data } = await admin
      .from("profiles")
      .select("role")
      .eq("id", bob.id)
      .single();
    expect(data!.role).toBe("user");
  });

  it("stops a user re-enabling a disabled account", async () => {
    await admin.from("profiles").update({ disabled: true }).eq("id", bob.id);
    await bob.client.from("profiles").update({ disabled: false }).eq("id", bob.id);

    const { data } = await admin
      .from("profiles")
      .select("disabled")
      .eq("id", bob.id)
      .single();
    expect(data!.disabled).toBe(true);

    await admin.from("profiles").update({ disabled: false }).eq("id", bob.id);
  });

  it("hides tool system prompts from the anon and authenticated roles", async () => {
    const { error } = await bob.client.from("tools").select("system_prompt");
    // The column grant was withdrawn, so selecting it is an error.
    expect(error).not.toBeNull();
  });

  it("hides payment events and AI usage from ordinary users", async () => {
    const events = await bob.client.from("payment_events").select("id");
    const usage = await bob.client.from("ai_usage").select("id");
    expect(events.data ?? []).toHaveLength(0);
    expect(usage.data ?? []).toHaveLength(0);
  });

  /* ----------------------------------------------------- credit ledger */

  it("deducts credits and writes a matching ledger entry", async () => {
    const { data: before } = await admin
      .from("credit_balances")
      .select("balance")
      .eq("user_id", alice.id)
      .single();

    const { data: after, error } = await admin.rpc("consume_credits", {
      p_user_id: alice.id,
      p_amount: 20,
      p_description: "AI Writer",
    });

    expect(error).toBeNull();
    expect(after).toBe(before!.balance - 20);

    const { data: tx } = await admin
      .from("credit_transactions")
      .select("type, amount, balance_after")
      .eq("user_id", alice.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    expect(tx!.type).toBe("usage");
    expect(tx!.amount).toBe(-20);
    expect(tx!.balance_after).toBe(after);
  });

  it("refuses to overdraw", async () => {
    const { error } = await admin.rpc("consume_credits", {
      p_user_id: alice.id,
      p_amount: 10_000_000,
      p_description: "Too expensive",
    });
    expect(error?.message).toContain("insufficient_credits");
  });

  it("refunds credits after a failed generation", async () => {
    const { data: before } = await admin
      .from("credit_balances")
      .select("balance")
      .eq("user_id", alice.id)
      .single();

    await admin.rpc("consume_credits", {
      p_user_id: alice.id,
      p_amount: 20,
      p_description: "AI Writer",
    });
    const { data: after } = await admin.rpc("refund_credits", {
      p_user_id: alice.id,
      p_amount: 20,
      p_description: "Refund — generation failed",
    });

    // Net zero: the user is not charged for a result they never received.
    expect(after).toBe(before!.balance);
  });

  it("survives concurrent spending without going negative", async () => {
    await admin
      .from("credit_balances")
      .update({ balance: 100 })
      .eq("user_id", bob.id);

    // Ten simultaneous 20-credit requests against a 100-credit balance:
    // exactly five may succeed.
    const attempts = Array.from({ length: 10 }, () =>
      admin.rpc("consume_credits", {
        p_user_id: bob.id,
        p_amount: 20,
        p_description: "Concurrency probe",
      }),
    );
    const results = await Promise.all(attempts);
    const succeeded = results.filter((r) => !r.error).length;

    const { data: balance } = await admin
      .from("credit_balances")
      .select("balance")
      .eq("user_id", bob.id)
      .single();

    expect(succeeded).toBe(5);
    expect(balance!.balance).toBe(0);
    expect(balance!.balance).toBeGreaterThanOrEqual(0);
  }, 30_000);

  /* --------------------------------------------------------- payments */

  it("credits an order exactly once, however many times it is processed", async () => {
    const { data: order } = await admin
      .from("orders")
      .insert({
        user_id: bob.id,
        plan_id: "lifetime",
        plan_name: "Lifetime",
        amount: 49,
        currency: "USD",
        credits: 10_000,
        status: "pending",
        payment_provider: "test",
      })
      .select("id")
      .single();

    const { data: before } = await admin
      .from("credit_balances")
      .select("balance")
      .eq("user_id", bob.id)
      .single();

    const first = await admin.rpc("complete_order_and_credit", {
      p_order_id: order!.id,
      p_provider_payment_id: "pay_123",
    });
    const second = await admin.rpc("complete_order_and_credit", {
      p_order_id: order!.id,
      p_provider_payment_id: "pay_123",
    });
    const third = await admin.rpc("complete_order_and_credit", {
      p_order_id: order!.id,
      p_provider_payment_id: "pay_123",
    });

    expect(first.data).toBe(true);
    // Replays report "no work done" and change nothing.
    expect(second.data).toBe(false);
    expect(third.data).toBe(false);

    const { data: after } = await admin
      .from("credit_balances")
      .select("balance")
      .eq("user_id", bob.id)
      .single();

    expect(after!.balance).toBe(before!.balance + 10_000);

    const { data: purchases } = await admin
      .from("credit_transactions")
      .select("id")
      .eq("reference_id", order!.id)
      .eq("type", "purchase");
    expect(purchases).toHaveLength(1);
  });

  it("rejects a duplicate webhook event at the database level", async () => {
    const eventId = `evt-${Date.now()}`;

    const first = await admin.from("payment_events").insert({
      provider: "test",
      provider_event_id: eventId,
      event_type: "finished",
    });
    const second = await admin.from("payment_events").insert({
      provider: "test",
      provider_event_id: eventId,
      event_type: "finished",
    });

    expect(first.error).toBeNull();
    // 23505 is what the webhook route reads to short-circuit a replay.
    expect(second.error?.code).toBe("23505");
  });

  it("stops a user marking their own order completed", async () => {
    const { data: order } = await admin
      .from("orders")
      .insert({
        user_id: bob.id,
        plan_id: "starter",
        plan_name: "Starter",
        amount: 9,
        currency: "USD",
        credits: 500,
        status: "pending",
        payment_provider: "test",
      })
      .select("id")
      .single();

    await bob.client
      .from("orders")
      .update({ status: "completed", credited: true })
      .eq("id", order!.id);

    const { data } = await admin
      .from("orders")
      .select("status, credited")
      .eq("id", order!.id)
      .single();

    expect(data!.status).toBe("pending");
    expect(data!.credited).toBe(false);
  });

  it("never lets a refund push a balance negative", async () => {
    await admin.from("credit_balances").update({ balance: 5 }).eq("user_id", bob.id);

    const { data: order } = await admin
      .from("orders")
      .insert({
        user_id: bob.id,
        plan_id: "pro",
        plan_name: "Pro",
        amount: 19,
        currency: "USD",
        credits: 2_500,
        status: "completed",
        payment_provider: "test",
        credited: true,
      })
      .select("id")
      .single();

    await admin.rpc("refund_order", { p_order_id: order!.id });

    const { data: balance } = await admin
      .from("credit_balances")
      .select("balance")
      .eq("user_id", bob.id)
      .single();

    expect(balance!.balance).toBe(0);
    expect(balance!.balance).toBeGreaterThanOrEqual(0);
  });

  /* ------------------------------------------------------------ admin */

  it("reports a non-admin as not an admin", async () => {
    const { data } = await bob.client.rpc("is_admin", { p_user_id: bob.id });
    expect(data).toBe(false);
  });

  it("stops a non-admin adjusting anyone's credits through the RPC", async () => {
    const { error } = await bob.client.rpc("admin_adjust_credits", {
      p_user_id: bob.id,
      p_amount: 999_999,
      p_description: "self-serve",
    });
    expect(error).not.toBeNull();

    const { data } = await admin
      .from("credit_balances")
      .select("balance")
      .eq("user_id", bob.id)
      .single();
    expect(data!.balance).toBeLessThan(999_999);
  });
});
