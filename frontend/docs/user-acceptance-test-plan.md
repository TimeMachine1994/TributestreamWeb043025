# TributeStream User Acceptance Test Plan

This document outlines the key user flows for manual testing of the TributeStream application, provides a checklist for verifying all features, and includes screenshots of expected UI states.

## 1. Test Environment Setup

Before beginning the user acceptance testing, ensure the following:

- The application is deployed to the testing environment
- Test user accounts are created for each role:
  - Family Contact
  - Funeral Director
  - Administrator
- Test data is loaded into the database
- All third-party integrations are configured for the test environment

## 2. Key User Flows

### 2.1 Family Dashboard Flow

#### 2.1.1 Login and View Dashboard

1. Navigate to the login page
2. Enter credentials for a Family Contact user
3. Verify successful login and redirection to the Family Dashboard
4. Verify the dashboard displays:
   - User role information
   - Tribute URL
   - Livestream schedule
   - Pending/saved checkouts
   - List of tributes

**Expected UI State:**
```
+------------------------------------------+
|                 NAVBAR                   |
+------------------------------------------+
| Family Dashboard                         |
| Manage your family tributes and...       |
|                                          |
| Your Tribute URL                         |
| tributestream.com/your-tribute           |
|                                          |
| [Share with] [Payment Complete]          |
+------------------------------------------+
| Livestream Schedule                      |
| +--------------------------------------+ |
| | Start Time | Type | Duration | Loc   | |
| | 10:00 AM   | Vis  | 1 hour   | ChapA | |
| | 11:30 AM   | Serv | 2 hours  | Main  | |
| +--------------------------------------+ |
+------------------------------------------+
| Pending Checkouts (1 pending)            |
| +--------------------------------------+ |
| | Date       | Package | Total | Status| |
| | May 1, 2025| Solo    | $399  | Pend  | |
| +--------------------------------------+ |
| [Resume Checkout]                        |
+------------------------------------------+
```

#### 2.1.2 Edit Tribute

1. Locate a tribute in the list
2. Click the edit button
3. Modify the tribute name
4. Save changes
5. Verify the tribute name is updated in the list
6. Verify a success message is displayed

#### 2.1.3 Share Tribute

1. Click the "Share with" button
2. Verify social sharing options appear
3. Select a sharing option
4. Verify the sharing dialog opens with the correct URL

#### 2.1.4 Resume Checkout

1. Locate a pending checkout in the list
2. Click the "Resume Checkout" button
3. Verify redirection to the checkout page
4. Verify the checkout page displays the correct information

### 2.2 Calculator Flow

#### 2.2.1 Complete Calculator Form

1. Navigate to the calculator page
2. Fill in basic information (Step 1)
   - Your Name
   - Email Address
   - Phone Number
3. Click Next
4. Fill in livestream details (Step 2)
   - Livestream Date
   - Livestream Start Time
   - Livestream Location
   - Is this at a funeral home? (Yes/No)
5. Click Next
6. Select a package (Step 3)
   - Solo Package ($399)
   - Anywhere Package ($499)
   - Legacy Package ($799)
7. Click Next
8. Configure additional options (Step 4)
   - Livestream Duration
   - Additional Addresses
9. Click Next
10. Review summary and proceed to checkout

**Expected UI State:**
```
+------------------------------------------+
|                 NAVBAR                   |
+------------------------------------------+
| Livestream Setup                         |
| Step 5 of 5                              |
|                                          |
| Your Loved One's Custom Link:            |
| john-doe-memorial                        |
|                                          |
| Summary of your selections:              |
| Name: John Doe                           |
| Email: john.doe@example.com              |
| Phone: 555-123-4567                      |
| Date: 2025-06-15                         |
| Package: Solo                            |
|                                          |
| [Save & Checkout Now]                    |
| [Save & Checkout Later]                  |
+---------------+----------------------------+
|               | Your Cart                  |
|               | Package: Solo - $399       |
|               | Extended Duration: +$50    |
|               | Total Cost: $449           |
+---------------+----------------------------+
```

#### 2.2.2 Save for Later

1. Complete the calculator form
2. Click "Save & Checkout Later"
3. Verify a success message is displayed
4. Verify redirection to the Family Dashboard
5. Verify the saved checkout appears in the dashboard

### 2.3 Checkout Flow

#### 2.3.1 Complete Checkout

1. Navigate to the checkout page (either from calculator or by resuming a saved checkout)
2. Verify the order summary displays the correct information
3. Fill in payment information:
   - Billing First Name
   - Billing Last Name
   - Billing Address
   - Card Number (use test card: 4111 1111 1111 1111)
   - Card Expiry (use future date)
   - Card CVV (use any 3 digits)
4. Click "Complete Purchase"
5. Verify successful payment processing
6. Verify redirection to the Family Dashboard
7. Verify the checkout is marked as completed

**Expected UI State:**
```
+------------------------------------------+
|                 NAVBAR                   |
+------------------------------------------+
| Complete Your Purchase                   |
|                                          |
+---------------+------------------------+ |
| Order Summary | Payment Information    | |
| Legacy Package| Billing Information    | |
| Base Package  | [First Name]  [Last]   | |
| $799          | [Billing Address     ] | |
|               |                        | |
| Extra Hours(2)| Payment Details        | |
| $100          | [Card Number         ] | |
|               | [Expiry]     [CVV]     | |
| Total: $899   |                        | |
|               | [Complete Purchase $899]| |
+---------------+------------------------+ |
+------------------------------------------+
```

#### 2.3.2 Validation Errors

1. Navigate to the checkout page
2. Submit the form without filling in any fields
3. Verify validation errors are displayed for all required fields
4. Fill in some fields with invalid data (e.g., invalid card number)
5. Submit the form
6. Verify validation errors are displayed for the invalid fields

## 3. Feature Verification Checklist

### 3.1 Authentication

- [ ] User can log in with valid credentials
- [ ] User cannot log in with invalid credentials
- [ ] User is redirected to appropriate dashboard based on role
- [ ] User can log out
- [ ] Protected routes require authentication

### 3.2 Family Dashboard

- [ ] Dashboard displays user role information
- [ ] Dashboard displays tribute URL
- [ ] Dashboard displays livestream schedule
- [ ] Dashboard displays pending/saved checkouts
- [ ] Dashboard displays list of tributes
- [ ] User can edit tribute name
- [ ] User can share tribute via social media
- [ ] User can resume checkout
- [ ] User can view tribute details
- [ ] User can navigate to calculator

### 3.3 Calculator

- [ ] Calculator displays all steps correctly
- [ ] User can navigate between steps
- [ ] User can fill in basic information
- [ ] User can fill in livestream details
- [ ] User can select a package
- [ ] User can configure additional options
- [ ] Calculator calculates total cost correctly
- [ ] User can save for later
- [ ] User can proceed to checkout
- [ ] Form validation works correctly

### 3.4 Checkout

- [ ] Checkout displays order summary correctly
- [ ] Checkout displays payment form
- [ ] User can fill in billing information
- [ ] User can fill in payment details
- [ ] Form validation works correctly
- [ ] Payment processing works correctly
- [ ] User is redirected after successful payment
- [ ] Error handling works correctly

## 4. Cross-Browser Testing

Test the application in the following browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome (Android)

## 5. Responsive Design Testing

Test the application at the following screen sizes:

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## 6. Accessibility Testing

- [ ] All images have alt text
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Keyboard navigation works correctly
- [ ] Screen reader compatibility
- [ ] Form labels are properly associated with inputs
- [ ] Error messages are announced to screen readers

## 7. Performance Testing

- [ ] Page load time is acceptable (< 3 seconds)
- [ ] Interactions are responsive
- [ ] No memory leaks
- [ ] No excessive network requests
- [ ] Images are optimized

## 8. Security Testing

- [ ] Authentication works correctly
- [ ] Authorization checks are in place
- [ ] CSRF protection is implemented
- [ ] XSS protection is implemented
- [ ] Sensitive data is not exposed in client-side code
- [ ] API endpoints are properly secured

## 9. Test Reporting

For each test case, record the following information:

- Test case ID
- Test case description
- Steps to reproduce
- Expected result
- Actual result
- Pass/Fail status
- Screenshots (if applicable)
- Browser/device information
- Tester name
- Date tested

## 10. Defect Reporting

For each defect found, record the following information:

- Defect ID
- Defect description
- Steps to reproduce
- Expected result
- Actual result
- Severity (Critical, Major, Minor, Trivial)
- Priority (High, Medium, Low)
- Screenshots/videos
- Browser/device information
- Tester name
- Date reported

## 11. Test Data

### 11.1 Test Users

| Username | Password | Role |
|----------|----------|------|
| family@example.com | testpass123 | Family Contact |
| fd@example.com | testpass123 | Funeral Director |
| admin@example.com | testpass123 | Administrator |

### 11.2 Test Credit Cards

| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| 4111 1111 1111 1111 | Any future date | Any 3 digits | Success |
| 4242 4242 4242 4242 | Any future date | Any 3 digits | Success |
| 4000 0000 0000 0002 | Any future date | Any 3 digits | Declined |

## 12. Sign-off

Once all tests have been completed and all critical and major defects have been resolved, the following stakeholders must sign off on the release:

- Product Owner
- QA Lead
- Development Lead
- UX Designer

## Appendix: Expected UI Screenshots

### Family Dashboard
![Family Dashboard](https://example.com/screenshots/family-dashboard.png)

### Calculator - Step 1
![Calculator Step 1](https://example.com/screenshots/calculator-step1.png)

### Calculator - Step 5
![Calculator Step 5](https://example.com/screenshots/calculator-step5.png)

### Checkout Page
![Checkout Page](https://example.com/screenshots/checkout.png)

### Payment Success
![Payment Success](https://example.com/screenshots/payment-success.png)