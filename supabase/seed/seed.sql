-- ============================================================================
-- Oply — seed data
--
-- Categories and operational settings only. The 10 launch tools are seeded
-- from config/tools.ts by `npm run db:sync-tools`, so the registry stays the
-- single source of truth and DB rows act as admin-editable overrides.
--
-- No fake users, revenue or analytics are seeded.
-- ============================================================================

insert into public.tool_categories (slug, name, description, icon, enabled, sort_order) values
  ('ai',           'AI',           'General-purpose AI tools for writing, rewriting and summarizing everyday content.', 'Sparkles',     true, 1),
  ('seo',          'SEO',          'Generate titles, meta descriptions, structured data and outlines for pages you actually want to rank.', 'Search', true, 2),
  ('marketing',    'Marketing',    'Copy and messaging tools for campaigns, launches and landing pages.', 'Megaphone',    true, 3),
  ('business',     'Business',     'Day-to-day business communication — replies, briefs and documents.', 'Briefcase',    true, 4),
  ('ecommerce',    'E-commerce',   'Product copy, listings and store content for online sellers.', 'ShoppingBag',  true, 5),
  ('creator',      'Creator',      'Tools for creators publishing across blogs, video and social.', 'Clapperboard', true, 6),
  ('productivity', 'Productivity', 'Small utilities that remove busywork from your day.', 'Zap',          true, 7),
  ('developer',    'Developer',    'Generators and helpers for people who ship software.', 'Code2',        true, 8),
  ('utilities',    'Utilities',    'General helpers that do not fit anywhere else.', 'Wrench',       true, 9),
  ('images',       'Images',       'AI image generation tools for thumbnails, social graphics, product photos, logos and background editing.', 'Image', true, 10)
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  sort_order  = excluded.sort_order;

insert into public.site_settings (key, value) values
  ('signup_bonus_credits',  '50'::jsonb),
  ('low_credit_threshold',  '100'::jsonb),
  ('anonymous_demo_enabled','false'::jsonb),
  ('ai_rate_limit_per_min', '10'::jsonb),
  ('support_email',         '"support@oply.me"'::jsonb),
  ('maintenance_mode',      'false'::jsonb)
on conflict (key) do nothing;
