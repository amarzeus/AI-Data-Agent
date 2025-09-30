# TODO: Fix User Registration and Signin Issues

## Current Status
- Analyzed backend auth endpoints and services - appear structurally correct
- Analyzed frontend auth components and API calls - appear correct
- Identified potential issues: missing error logging, unclear error messages, token storage issues

## Tasks
- [x] Add detailed logging in backend auth_service.py create_user and authenticate_user methods
- [x] Enhance error message display in frontend AuthPanel.tsx to show backend error details
- [x] Verify and improve token storage/retrieval in frontend useAuth.ts hook
- [ ] Test backend auth endpoints manually to isolate issues
- [ ] Test frontend auth flow after fixes
