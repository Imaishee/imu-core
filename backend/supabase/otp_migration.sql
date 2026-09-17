-- OTP codes for email verification & password reset (Resend-delivered)
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  purpose text not null default 'signup',
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists otp_codes_email_idx on public.otp_codes(email);
create index if not exists otp_codes_email_purpose_idx on public.otp_codes(email, purpose);

alter table public.otp_codes enable row level security;

drop policy if exists "otp service all" on public.otp_codes;
create policy "otp service all" on public.otp_codes
  for all to authenticated
  using (true) with check (true);