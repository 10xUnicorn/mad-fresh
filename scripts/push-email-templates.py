#!/usr/bin/env python3
"""
Mad Fresh Kitchen — Supabase Auth Email Templates Push Script
Pushes all 6 branded HTML email templates to Supabase project via Management API.

Usage:
  export SUPABASE_ACCESS_TOKEN=your_token_here
  python3 push-email-templates.py

Or run without the env var and the script will prompt you.

Get a personal access token at: https://supabase.com/dashboard/account/tokens
"""

import os
import sys
import json
import requests

PROJECT_REF = "nuqksieyqplxrpitnkji"
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth"
SITE_URL = "https://mad-fresh.vercel.app"

# ---------------------------------------------------------------------------
# Template HTML — all inline CSS, table-based layout, email-client safe
# ---------------------------------------------------------------------------

CONFIRM_SIGNUP_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm Your Mad Fresh Kitchen Account</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #1e1e1e;">
          <tr>
            <td align="center" style="padding:40px 40px 24px 40px;">
              <div style="margin-bottom:4px;">
                <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">MAD</span><span style="font-size:28px;font-weight:800;color:#75F663;letter-spacing:-0.5px;">FRESH</span>
              </div>
              <div style="font-size:11px;font-weight:600;color:#555555;letter-spacing:4px;text-transform:uppercase;">KITCHEN</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1e1e1e;"></div></td>
          </tr>
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Welcome to Mad Fresh Kitchen!</h1>
              <p style="margin:0 0 16px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">You're one tap away from joining a community that takes food seriously. Confirm your email to activate your account and start exploring fresh, community-driven meals.</p>
              <p style="margin:0 0 28px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">Hit the button below to verify your email address.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 28px 40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#75F663;border-radius:10px;">
                    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:0 32px;height:48px;line-height:48px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;letter-spacing:0.2px;">Confirm My Account</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#555555;">Or copy this link:</p>
              <p style="margin:0;font-size:12px;color:#75F663;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#75F663;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1a1a1a;"></div></td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px 40px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#555555;text-align:center;">Mad Fresh Kitchen &mdash; Fresh meals, delivered.</p>
              <p style="margin:0;font-size:11px;color:#3d3d3d;text-align:center;">You received this email because an account was created using this address. If this wasn't you, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

INVITE_USER_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You've Been Invited to Mad Fresh Kitchen</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #1e1e1e;">
          <tr>
            <td align="center" style="padding:40px 40px 24px 40px;">
              <div style="margin-bottom:4px;">
                <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">MAD</span><span style="font-size:28px;font-weight:800;color:#75F663;letter-spacing:-0.5px;">FRESH</span>
              </div>
              <div style="font-size:11px;font-weight:600;color:#555555;letter-spacing:4px;text-transform:uppercase;">KITCHEN</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1e1e1e;"></div></td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 40px 0 40px;">
              <div style="display:inline-block;background-color:#1a2e18;border:1px solid #449531;border-radius:20px;padding:6px 16px;">
                <span style="font-size:12px;font-weight:700;color:#75F663;letter-spacing:1px;text-transform:uppercase;">You're Invited</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 0 40px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Someone wants you in the kitchen.</h1>
              <p style="margin:0 0 16px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">You've been personally invited to join Mad Fresh Kitchen &mdash; where the food is real, the community is hungry, and the energy is always fresh.</p>
              <p style="margin:0 0 28px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">Accept your invitation below to create your account and get started.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 28px 40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#75F663;border-radius:10px;">
                    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:0 32px;height:48px;line-height:48px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;letter-spacing:0.2px;">Accept Invitation</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#555555;">Or copy this link:</p>
              <p style="margin:0;font-size:12px;color:#75F663;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#75F663;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1a1a1a;"></div></td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px 40px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#555555;text-align:center;">Mad Fresh Kitchen &mdash; Fresh meals, delivered.</p>
              <p style="margin:0;font-size:11px;color:#3d3d3d;text-align:center;">This invitation was sent to you by a Mad Fresh Kitchen team member. If you weren't expecting this, you can safely ignore it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

MAGIC_LINK_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Mad Fresh Kitchen Login Link</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #1e1e1e;">
          <tr>
            <td align="center" style="padding:40px 40px 24px 40px;">
              <div style="margin-bottom:4px;">
                <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">MAD</span><span style="font-size:28px;font-weight:800;color:#75F663;letter-spacing:-0.5px;">FRESH</span>
              </div>
              <div style="font-size:11px;font-weight:600;color:#555555;letter-spacing:4px;text-transform:uppercase;">KITCHEN</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1e1e1e;"></div></td>
          </tr>
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Your login link is ready.</h1>
              <p style="margin:0 0 16px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">No password needed. Just tap the button below and you're in &mdash; straight to your Mad Fresh Kitchen dashboard.</p>
              <p style="margin:0 0 28px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">This link expires in 60 minutes and can only be used once.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 28px 40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#75F663;border-radius:10px;">
                    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:0 32px;height:48px;line-height:48px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;letter-spacing:0.2px;">Log In Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#555555;">Or copy this link:</p>
              <p style="margin:0;font-size:12px;color:#75F663;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#75F663;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1a1a1a;"></div></td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px 40px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#555555;text-align:center;">Mad Fresh Kitchen &mdash; Fresh meals, delivered.</p>
              <p style="margin:0;font-size:11px;color:#3d3d3d;text-align:center;">You requested a magic login link. If you didn't make this request, no action is needed &mdash; your account is safe.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

PASSWORD_RESET_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset Your Mad Fresh Kitchen Password</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #1e1e1e;">
          <tr>
            <td align="center" style="padding:40px 40px 24px 40px;">
              <div style="margin-bottom:4px;">
                <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">MAD</span><span style="font-size:28px;font-weight:800;color:#75F663;letter-spacing:-0.5px;">FRESH</span>
              </div>
              <div style="font-size:11px;font-weight:600;color:#555555;letter-spacing:4px;text-transform:uppercase;">KITCHEN</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1e1e1e;"></div></td>
          </tr>
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Reset your password.</h1>
              <p style="margin:0 0 16px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">We received a request to reset the password for your Mad Fresh Kitchen account. If you made this request, click below to choose a new password.</p>
              <p style="margin:0 0 28px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">This link expires in 60 minutes. If you didn't request a reset, you can ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 28px 40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#75F663;border-radius:10px;">
                    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:0 32px;height:48px;line-height:48px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;letter-spacing:0.2px;">Reset My Password</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#555555;">Or copy this link:</p>
              <p style="margin:0;font-size:12px;color:#75F663;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#75F663;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1a1a1a;"></div></td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px 40px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#555555;text-align:center;">Mad Fresh Kitchen &mdash; Fresh meals, delivered.</p>
              <p style="margin:0;font-size:11px;color:#3d3d3d;text-align:center;">If you didn't request a password reset, your account is safe and no changes have been made.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

EMAIL_CHANGE_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm Your New Email - Mad Fresh Kitchen</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #1e1e1e;">
          <tr>
            <td align="center" style="padding:40px 40px 24px 40px;">
              <div style="margin-bottom:4px;">
                <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">MAD</span><span style="font-size:28px;font-weight:800;color:#75F663;letter-spacing:-0.5px;">FRESH</span>
              </div>
              <div style="font-size:11px;font-weight:600;color:#555555;letter-spacing:4px;text-transform:uppercase;">KITCHEN</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1e1e1e;"></div></td>
          </tr>
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Confirm your new email address.</h1>
              <p style="margin:0 0 16px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">You recently requested to update the email address on your Mad Fresh Kitchen account. To complete this change, confirm your new address by clicking the button below.</p>
              <p style="margin:0 0 28px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">Your current email will remain active until this change is confirmed.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 28px 40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#75F663;border-radius:10px;">
                    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:0 32px;height:48px;line-height:48px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;letter-spacing:0.2px;">Confirm New Email</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#555555;">Or copy this link:</p>
              <p style="margin:0;font-size:12px;color:#75F663;word-break:break-all;"><a href="{{ .ConfirmationURL }}" style="color:#75F663;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1a1a1a;"></div></td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px 40px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#555555;text-align:center;">Mad Fresh Kitchen &mdash; Fresh meals, delivered.</p>
              <p style="margin:0;font-size:11px;color:#3d3d3d;text-align:center;">If you didn't request an email change, please contact support immediately as your account may have been accessed without your permission.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

REAUTHENTICATION_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Mad Fresh Kitchen Verification Code</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #1e1e1e;">
          <tr>
            <td align="center" style="padding:40px 40px 24px 40px;">
              <div style="margin-bottom:4px;">
                <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">MAD</span><span style="font-size:28px;font-weight:800;color:#75F663;letter-spacing:-0.5px;">FRESH</span>
              </div>
              <div style="font-size:11px;font-weight:600;color:#555555;letter-spacing:4px;text-transform:uppercase;">KITCHEN</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1e1e1e;"></div></td>
          </tr>
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Your verification code.</h1>
              <p style="margin:0 0 28px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">Use the code below to verify your identity and complete your action on Mad Fresh Kitchen. This code expires in 10 minutes.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 32px 40px;">
              <table cellpadding="0" cellspacing="0" border="0" style="background-color:#1a2e18;border:1px solid #449531;border-radius:12px;">
                <tr>
                  <td style="padding:20px 40px;">
                    <div style="font-size:36px;font-weight:800;color:#75F663;letter-spacing:10px;text-align:center;font-variant-numeric:tabular-nums;">{{ .Token }}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;border-radius:8px;width:100%;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:12px;color:#666666;line-height:1.5;">Never share this code with anyone. Mad Fresh Kitchen staff will never ask for your verification code.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><div style="height:1px;background-color:#1a1a1a;"></div></td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px 40px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#555555;text-align:center;">Mad Fresh Kitchen &mdash; Fresh meals, delivered.</p>
              <p style="margin:0;font-size:11px;color:#3d3d3d;text-align:center;">You received this code because a verification was requested for your account. If this wasn't you, please secure your account immediately.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

# ---------------------------------------------------------------------------
# Main push logic
# ---------------------------------------------------------------------------

def get_access_token():
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
    if not token:
        print("SUPABASE_ACCESS_TOKEN not found in environment.")
        print("Get a personal access token at: https://supabase.com/dashboard/account/tokens")
        token = input("Paste your Supabase access token: ").strip()
    if not token:
        print("ERROR: No access token provided. Exiting.")
        sys.exit(1)
    return token


def build_payload():
    return {
        # site_url — ensures {{ .SiteURL }} and redirect links work correctly
        "site_url": SITE_URL,

        # Confirm Sign Up
        "mailer_subjects_confirmation": "Confirm Your Mad Fresh Kitchen Account",
        "mailer_templates_confirmation_content": CONFIRM_SIGNUP_HTML,

        # Invite User
        "mailer_subjects_invite": "You've Been Invited to Mad Fresh Kitchen",
        "mailer_templates_invite_content": INVITE_USER_HTML,

        # Magic Link
        "mailer_subjects_magic_link": "Your Mad Fresh Kitchen Login Link",
        "mailer_templates_magic_link_content": MAGIC_LINK_HTML,

        # Password Reset (key uses "recovery" — not "reset")
        "mailer_subjects_recovery": "Reset Your Mad Fresh Kitchen Password",
        "mailer_templates_recovery_content": PASSWORD_RESET_HTML,

        # Email Change
        "mailer_subjects_email_change": "Confirm Your New Email \u2014 Mad Fresh Kitchen",
        "mailer_templates_email_change_content": EMAIL_CHANGE_HTML,

        # Reauthentication (OTP)
        "mailer_subjects_reauthentication": "Your Mad Fresh Kitchen Verification Code",
        "mailer_templates_reauthentication_content": REAUTHENTICATION_HTML,
    }


def push_templates(token: str, payload: dict):
    print(f"\nPushing templates to project: {PROJECT_REF}")
    print(f"Endpoint: PATCH {API_URL}\n")

    response = requests.patch(
        API_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        data=json.dumps(payload),
        timeout=30,
    )

    return response


def verify_response(response):
    print(f"Response status: {response.status_code}")

    if response.status_code != 200:
        print(f"\nERROR: Unexpected status code {response.status_code}")
        print("Response body:")
        print(response.text)
        sys.exit(1)

    data = response.json()

    checks = {
        "Confirm Sign Up subject":     data.get("mailer_subjects_confirmation"),
        "Invite User subject":         data.get("mailer_subjects_invite"),
        "Magic Link subject":          data.get("mailer_subjects_magic_link"),
        "Password Reset subject":      data.get("mailer_subjects_recovery"),
        "Email Change subject":        data.get("mailer_subjects_email_change"),
        "Reauthentication subject":    data.get("mailer_subjects_reauthentication"),
        "Site URL":                    data.get("site_url"),
    }

    print("\nVerification — confirming applied values:")
    print("-" * 60)
    all_ok = True
    for label, value in checks.items():
        if value:
            print(f"  [OK]  {label}: {value}")
        else:
            print(f"  [!!]  {label}: NOT SET or empty")
            all_ok = False

    print("-" * 60)
    if all_ok:
        print("\nAll 6 templates + site_url pushed successfully.")
        print("Mad Fresh Kitchen auth emails are now fully branded.")
    else:
        print("\nWARNING: Some values were not confirmed in the response.")
        print("Check the Supabase dashboard at:")
        print(f"  https://supabase.com/dashboard/project/{PROJECT_REF}/auth/templates")


def main():
    token = get_access_token()
    payload = build_payload()
    response = push_templates(token, payload)
    verify_response(response)


if __name__ == "__main__":
    main()
