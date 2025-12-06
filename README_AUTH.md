# CRM Authentication Setup

The CRM now requires authentication with role-based access control.

## Creating an Admin User

To create your first admin user, run:

```bash
cd soulmate_backend
node scripts/createAdmin.js <username> <password> [role]
```

Example:
```bash
node scripts/createAdmin.js admin mypassword123 admin
```

## Roles

Currently supported roles:
- `admin` - Full access to all CRM features

## Login

1. Start the backend server
2. Open the CRM in your browser
3. You'll be redirected to the login page
4. Enter your username and password
5. You'll be logged in and can access the CRM dashboard

## Security Notes

- Tokens expire after 24 hours
- All admin routes are protected with authentication middleware
- Passwords are hashed using SHA-256
- In production, consider using JWT tokens instead of base64 tokens


