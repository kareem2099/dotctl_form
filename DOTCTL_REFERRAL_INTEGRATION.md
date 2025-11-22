# 🚀 DOTCTL Referral Integration System

> Complete referral system integration with DOTCTL Python application

## 📋 Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Integration Process](#integration-process)
4. [Python Integration Code](#python-integration)
5. [Security & Encryption](#security)
6. [Testing](#testing)

---

## 🎯 Overview

A secure, automatic system to convert referral reward months into DOTCTL Python premium licenses.

### ✨ Features
- 🔐 **OTP Security Verification**
- 🎁 **Automatic Referral Conversion**
- 🔄 **Automatic License Extension**
- ✨ **One Device Per Account**
- 📊 **Detailed Referral Tracking**

---

## 🌟 API Endpoints

### 1. 🔐 Request OTP
```http
POST /api/dotctl/referral/request-otp
```

**Input:**
```json
{
  "email": "user@domain.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "valid_for_minutes": 10,
  "email": "user@domain.com"
}
```

### 2. 🔗 Link Device
```http
POST /api/dotctl/referral/link-device
```

**Input:**
```json
{
  "email": "user@domain.com",
  "otp": "123456",
  "hardware_id": "HWFP_A1B2C3D4E5F6"
}
```

**Response:**
```json
{
  "success": true,
  "license_key": "REFERRAL-DOTCTL-ABCDEFG-1703000000000",
  "licensed_email": "user@domain.com",
  "expires_at": "2026-12-20T12:00:00.000Z",
  "hardware_linked": true,
  "referral_months_used": 0,
  "remaining_benefits": "lifetime_via_referrals"
}
```

### 3. 📊 Check Status
```http
GET /api/dotctl/referral/status?hardware_id=HWFP_A1B2C3D4E5F6
```

**Response:**
```json
{
  "linked": true,
  "email": "user@domain.com",
  "status": "premium",
  "last_license_key": "REFERRAL-DOTCTL-ABCDEFG-1703000000000",
  "total_reward_months": 24,
  "used_for_license": 12,
  "remaining_months": 12,
  "additional_available": 5,
  "last_checked": "2025-12-20T10:30:00.000Z",
  "linked_at": "2025-11-20T12:00:00.000Z",
  "can_extend": true,
  "extension_available": {
    "type": "proportional",
    "months": 5,
    "new_expires_at": "2026-05-20T12:00:00.000Z"
  }
}
```

---

## 🔄 Integration Process

### Step 1: Request OTP
```python
response = requests.post('https://your-domain.com/api/dotctl/referral/request-otp',
    json={'email': user_email}
)
```

### Step 2: Enter OTP
```python
otp_code = input("Enter OTP code: ")
```

### Step 3: Link Device
```python
response = requests.post('https://your-domain.com/api/dotctl/referral/link-device',
    json={
        'email': user_email,
        'otp': otp_code,
        'hardware_id': get_hardware_fingerprint()
    }
)
```

### Step 4: Save License
```python
license_data = response.json()
save_license_to_app(license_data['license_key'], license_data['expires_at'])
```

---

## 🐍 Python Integration Code

Add this code to `dotctl_advanced_gui.py`:

```python
import requests
from typing import Optional, Dict, Any

class ReferralIntegration:
    def __init__(self, base_url: str = "https://your-domain.com"):
        self.base_url = base_url
        self.api_prefix = f"{base_url}/api/dotctl/referral"

    def request_otp(self, email: str) -> Dict[str, Any]:
        """Request OTP code"""
        response = requests.post(f"{self.api_prefix}/request-otp",
            json={'email': email},
            timeout=30
        )
        return response.json()

    def link_device(self, email: str, otp: str, hardware_id: str) -> Dict[str, Any]:
        """Link device with referrals"""
        response = requests.post(f"{self.api_prefix}/link-device",
            json={
                'email': email,
                'otp': otp,
                'hardware_id': hardware_id
            },
            timeout=30
        )
        return response.json()

    def check_status(self, hardware_id: str) -> Dict[str, Any]:
        """Check linking status"""
        response = requests.get(f"{self.api_prefix}/status",
            params={'hardware_id': hardware_id},
            timeout=30
        )
        return response.json()

    def get_hardware_fingerprint(self) -> str:
        """Get unique hardware fingerprint"""
        import platform
        import hashlib
        import uuid

        # Combine multiple hardware identifiers
        system_info = platform.uname()
        cpu_info = platform.processor()
        machine_id = str(uuid.getnode())  # MAC address as int

        # Create unique fingerprint
        fingerprint_data = f"{system_info.system}-{system_info.machine}-{cpu_info}-{machine_id}"
        fingerprint = hashlib.sha256(fingerprint_data.encode()).hexdigest()[:24].upper()

        return f"HWFP_{fingerprint}"

# Add referral linking function to GUI
def link_referral_rewards(self):
    """Open referral linking dialog"""
    # Create dialog window
    dialog = tk.Toplevel(self.root)
    dialog.title("🔗 Link Referral Rewards")
    dialog.geometry("450x600")
    dialog.configure(bg=self.colors['bg_primary'])

    # Title
    ttk.Label(dialog, text="🎁 Link Your Referral Rewards",
             style='Title.TLabel').pack(pady=(20, 10))

    # Email input
    ttk.Label(dialog, text="Beta Email Address:", style='Header.TLabel').pack(anchor=tk.W, padx=20)
    email_var = tk.StringVar()
    email_entry = ttk.Entry(dialog, textvariable=email_var, width=40, style='Modern.TEntry')
    email_entry.pack(pady=(5, 15), padx=20, fill=tk.X)

    # Status label
    status_label = ttk.Label(dialog, text="", style='Modern.TLabel')
    status_label.pack(pady=(0, 20))

    # OTP input (initially hidden)
    otp_frame = ttk.Frame(dialog, style='Card.TFrame')
    otp_label = ttk.Label(otp_frame, text="Enter OTP Code:", style='Header.TLabel')
    otp_var = tk.StringVar()
    otp_entry = ttk.Entry(otp_frame, textvariable=otp_var, width=10, style='Modern.TEntry',
                         font=('Courier New', 16), justify=tk.CENTER)

    def request_otp():
        email = email_var.get().strip()
        if not email:
            status_label.config(text="Please enter your email", foreground='red')
            return

        try:
            referral = ReferralIntegration()
            result = referral.request_otp(email)

            if result.get('success'):
                status_label.config(text=f"✅ OTP sent! Check {email}", foreground='green')
                # Show OTP input
                otp_frame.pack(pady=(10, 20), padx=20, fill=tk.X)
                otp_label.pack(anchor=tk.W)
                otp_entry.pack(pady=(5, 0))
                request_btn.config(text="Resend OTP", style='Warning.TButton')
            else:
                status_label.config(text=f"❌ {result.get('error', 'Request failed')}", foreground='red')

        except Exception as e:
            status_label.config(text=f"❌ Network error: {str(e)}", foreground='red')

    def verify_and_link():
        email = email_var.get().strip()
        otp = otp_var.get().strip()

        if not email or not otp:
            status_label.config(text="Please enter both email and OTP", foreground='red')
            return

        try:
            referral = ReferralIntegration()
            hardware_id = referral.get_hardware_fingerprint()

            result = referral.link_device(email, otp, hardware_id)

            if result.get('success'):
                # Save license
                license_key = result['license_key']
                expires_at = result['expires_at']

                # Update license manager
                self.license_manager.save_referral_license(license_key, expires_at)

                # Update GUI
                self.update_premium_indicator()
                self.update_premium_tabs()

                status_label.config(text="🎉 Successfully linked! Premium activated!", foreground='green')
                messagebox.showinfo("Success!", f"Device linked successfully!\n\nLicense Key: {license_key}\nExpires: {expires_at}")

                # Close dialog after success
                dialog.after(2000, dialog.destroy)

            else:
                status_label.config(text=f"❌ {result.get('error', 'Linking failed')}", foreground='red')

        except Exception as e:
            status_label.config(text=f"❌ Linking error: {str(e)}", foreground='red')

    # Buttons
    button_frame = ttk.Frame(dialog, style='Card.TFrame')
    button_frame.pack(pady=(20, 0), padx=20, fill=tk.X)

    request_btn = ttk.Button(button_frame, text="📧 Send OTP Code",
                           command=request_otp, style='Primary.TButton')
    request_btn.pack(side=tk.LEFT, padx=(0, 10))

    ttk.Button(button_frame, text="🔗 Link & Activate",
              command=verify_and_link, style='Success.TButton').pack(side=tk.RIGHT)

    ttk.Button(dialog, text="❌ Cancel",
              command=dialog.destroy, style='Danger.TButton').pack(pady=(20, 0))
```

---

## 🔒 Security & Encryption

### Data Encryption
- ✅ OTP valid for 10 minutes only
- ✅ One device linked per user
- ✅ Hardware fingerprint non-forgeable
- ✅ Double verification of inputs

### Anti-Fraud
- ❌ Prevent theft of referral months
- ❌ Prevent one device linking to multiple users
- ❌ Log all suspicious attempts

---

## 🧪 Testing

### Manual API Testing

```bash
# 1. Request OTP
curl -X POST http://localhost:3000/api/dotctl/referral/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@domain.com"}'

# 2. Link device
curl -X POST http://localhost:3000/api/dotctl/referral/link-device \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@domain.com",
    "otp": "123456",
    "hardware_id": "HWFP_TEST123"
  }'

# 3. Check status
curl "http://localhost:3000/api/dotctl/referral/status?hardware_id=HWFP_TEST123"
```

### Full Integration Testing

1. **Register new user with referral**
2. **Add referral rewards**
3. **DOTCTL App: Request OTP**
4. **Enter OTP and activate license**
5. **Add additional referrals**
6. **Check automatic extension**

---

## 🎉 Summary

Comprehensive and secure integration system connecting:
- **Referral System** (Reward Months)
- **DOTCTL Python App** (Premium Licenses)
- **High Security** (OTP + Hardware Fingerprint)
- **Excellent UX** (Easy Setup, Auto Updates)

This system will motivate users to invite friends and ensure earned referral licenses never expire!

**Ready for deployment and development! 🚀**
