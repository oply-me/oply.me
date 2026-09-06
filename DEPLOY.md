# Deploying Oply

The repo is committed and clean — no credentials are tracked. Three stages:
push, host, domain.

## 1. Push to GitHub

Create an empty repo (no README, no .gitignore — this repo already has both),
then:

```bash
git remote add origin https://github.com/<you>/oply.git
git push -u origin main
```

Private is the sensible default: nothing secret is in the tree, but the credit
ledger, prompts and pricing logic are your product.

## 2. Host on Vercel

Import the GitHub repo at vercel.com/new. Framework auto-detects as Next.js;
the defaults are correct.

Before the first deploy, add every variable from `DEPLOY-ENV.txt` under
Settings -> Environment Variables, for the Production environment. Two must
differ from local:

- `NEXT_PUBLIC_APP_URL=https://oply.me` — baked into the client bundle at build
  time, so a wrong value ships wrong canonicals and sitemap URLs
- `DEV_PAYMENT_MODE=false` — the simulator route 404s in production anyway, but
  leave no doubt

## 3. Point oply.me at it

In Vercel: Settings -> Domains -> add `oply.me` and `www.oply.me`.

At your registrar, either delegate nameservers to Vercel, or add:

| Type  | Name | Value                 |
|-------|------|-----------------------|
| A     | @    | 76.76.21.21           |
| CNAME | www  | cname.vercel-dns.com  |

DNS takes minutes to hours. Vercel issues the TLS certificate automatically
once the records resolve.

## 4. Point the payment webhook at production

In the NOWPayments dashboard, set the IPN callback URL to:

```
https://oply.me/api/payments/webhook
```

Nothing credits an account until a signed webhook arrives here, so this step is
what makes payments actually work.

## 5. Verify the live deployment

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://oply.me
curl -s https://oply.me/robots.txt
curl -s https://oply.me/sitemap.xml | grep -c "<loc>"        # expect 32
curl -s -o /dev/null -w "%{http_code}\n" https://oply.me/dashboard   # expect 307
curl -s -X POST https://oply.me/api/payments/webhook -d '{}'         # expect 401
curl -s -o /dev/null -w "%{http_code}\n" https://oply.me/opengraph-image  # expect 200
curl -s -o /dev/null -w "%{http_code}\n" \
  https://oply.me/google1c3bba0784a1ef59.html                        # expect 200
```

The Search Console verification file must live in `public/` — Next.js does not
serve files from the repo root, so a copy sitting there returns 404 and
verification silently never completes.

Then sign up on the live site, run one tool, and confirm credits move.

## 6. Promote your admin account

After signing up on the live site, in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

This works correctly as of PATCH 002. Before that patch it silently did nothing.

## 7. First real payment

Buy one Starter pack ($9) and watch it land. The webhook path is proven in
tests, but nothing has moved real money yet — do this before you announce.
