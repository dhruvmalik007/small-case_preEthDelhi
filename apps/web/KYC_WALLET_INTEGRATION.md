# KYC and Wallet Integration

This document explains the KYC (Know Your Customer) verification and wallet connection integration implemented for the DeFi Smallcases platform.

## 🔐 **Authentication Flow**

### 1. **Clerk Authentication (Primary)**
- Users must be signed in with Clerk to access investment features
- Clerk handles user authentication, email verification, and account management
- User metadata includes KYC status information

### 2. **Privy Wallet Connection (Secondary)**
- Wallet connection only works if user is authenticated with Clerk
- Supports multiple wallet types (MetaMask, WalletConnect, etc.)
- Automatically connects wallet when user is signed in

## 🛡️ **KYC Verification System**

### **KYC Status Types:**
- `VERIFIED` - User can invest in all strategies
- `PENDING` - Verification under review, cannot invest
- `REJECTED` - Verification failed, cannot invest
- `not_verified` - No KYC started, cannot invest

### **KYC Components:**

#### 1. **KYCStatus Component** (`components/kyc/kyc-status.tsx`)
- Displays current KYC status with badges
- Shows verification prompts when needed
- Provides links to verification pages

#### 2. **KYC Pages:**
- `/investor/kyc` - Start KYC verification process (investor dashboard)
- `/investor/kyc/self-verify` - Privacy-preserving verification with Safe Passport

## 💰 **Investment Flow with KYC Checks**

### **Investment Modal Logic:**
1. **Check Clerk Authentication** - User must be signed in
2. **Check Wallet Connection** - Wallet must be connected via Privy
3. **Check KYC Status** - User must be KYC verified
4. **Allow Investment** - Only if all checks pass

### **Investment Restrictions:**
- ❌ Not signed in → Show "Sign In Required"
- ❌ No wallet connected → Show "Connect Wallet"
- ❌ KYC not verified → Show KYC verification prompt
- ✅ All checks pass → Allow investment

## 🎨 **UI Components**

### **Wallet Connection (Navbar)**
```typescript
// States handled:
- Not signed in → "Sign In Required"
- Signed in, no wallet → "Connect Wallet" 
- Signed in + wallet → Show address + disconnect
```

### **Investment Button (Strategy Pages)**
```typescript
// Shows KYC status badge alongside Invest button
<div className="flex items-center gap-2">
  <KYCStatus />
  <InvestModal strategy={strategy}>
    <button>Invest</button>
  </InvestModal>
</div>
```

### **Account Dropdown**
- Shows KYC status in personal info section
- Includes "KYC Status" link in activity section

## 📁 **File Structure**

```
apps/web/
├── components/
│   ├── wallet/
│   │   └── wallet-connect.tsx          # Wallet connection with Clerk checks
│   ├── kyc/
│   │   └── kyc-status.tsx              # KYC status display and hooks
│   ├── investment/
│   │   └── invest-modal.tsx            # Investment modal with KYC checks
│   └── site/
│       └── account-dropdown.tsx        # Account dropdown with KYC status
├── app/
│   ├── investor/
│   │   └── kyc/
│   │       ├── page.tsx                 # KYC verification page
│   │       └── self-verify/            # Safe Passport verification
│   └── strategies/
│       └── [slug]/page.tsx              # Strategy pages with KYC checks
└── lib/
    └── uniswap.ts                      # Investment processing
```

## 🔧 **Implementation Details**

### **KYC Status Hook:**
```typescript
export function useKYCStatus() {
  const { user, isSignedIn } = useUser();
  
  const getKYCStatus = () => {
    if (!isSignedIn || !user) {
      return { status: "not_signed_in", verified: false };
    }
    
    const kycStatus = user.publicMetadata?.kycStatus as string;
    // Return appropriate status based on kycStatus
  };
  
  return getKYCStatus();
}
```

### **Investment Modal Checks:**
```typescript
// Check order: Clerk → Wallet → KYC
{!isSignedIn ? (
  <Alert>Sign in required</Alert>
) : !authenticated ? (
  <Alert>Connect wallet</Alert>
) : !kycStatus.verified ? (
  <KYCStatus showAlert={true} />
) : (
  // Show investment form
)}
```

## 🚀 **Usage Examples**

### **1. Check KYC Status in Components:**
```typescript
import { useKYCStatus } from "@/components/kyc/kyc-status";

function MyComponent() {
  const kycStatus = useKYCStatus();
  
  if (!kycStatus.verified) {
    return <KYCStatus showAlert={true} />;
  }
  
  return <div>User can invest</div>;
}
```

### **2. Display KYC Status:**
```typescript
import { KYCStatus } from "@/components/kyc/kyc-status";

function UserProfile() {
  return (
    <div>
      <h3>Your Status</h3>
      <KYCStatus />
    </div>
  );
}
```

## 🔒 **Security Considerations**

### **Server-Side KYC Checks:**
- KYC status is stored in Clerk user metadata
- Server-side verification prevents client-side bypassing
- Investment API endpoints should verify KYC status

### **Database Integration:**
- KYC status should be synced with database
- User table should include KYC verification fields
- Audit trail for KYC status changes

## 🎯 **Next Steps for Production**

### **1. Real KYC Integration:**
- Integrate with KYC provider (Jumio, Onfido, etc.)
- Implement document upload and verification
- Add video verification for high-value investments

### **2. Enhanced Security:**
- Server-side KYC validation
- Rate limiting for investment attempts
- Fraud detection and monitoring

### **3. User Experience:**
- KYC progress tracking
- Email notifications for status changes
- Mobile-optimized verification flow

### **4. Compliance:**
- GDPR compliance for data handling
- AML (Anti-Money Laundering) checks
- Regulatory reporting requirements

## 🧪 **Testing Scenarios**

### **Test Cases:**
1. **Not signed in** → Should show sign-in prompt
2. **Signed in, no wallet** → Should show wallet connection
3. **Signed in + wallet, no KYC** → Should show KYC prompt
4. **All verified** → Should allow investment
5. **KYC pending** → Should show pending status
6. **KYC rejected** → Should show rejection message

### **Mock KYC Status:**
To test different states, update user metadata in Clerk:
```typescript
// In Clerk dashboard or via API
user.publicMetadata = {
  kycStatus: "VERIFIED" // or "PENDING", "REJECTED", null
};
```

## 📞 **Support Integration**

### **KYC Support Links:**
- Contact support for rejected KYC
- Help documentation for verification process
- Status check for pending verifications

This implementation provides a comprehensive KYC and wallet integration system that ensures only verified users can invest in strategies while maintaining a smooth user experience.
