# CRM Role System

## Overview

The CRM system now supports three role levels with different permissions:

1. **Super Admin** - Full control over all features
2. **Admin** (Default) - Can view users and create users only
3. **Viewer** - Read-only access

## Role Permissions

### Super Admin (`super_admin`) - Default Role
- ✅ View all customers
- ✅ Create admin users (including other super admins)
- ✅ View admin users list
- ✅ Cancel subscriptions
- ✅ Restore/reactivate subscriptions
- ✅ Deactivate customer accounts
- ✅ Activate customer accounts
- ✅ View all notifications
- ✅ Full access to all CRM features

### Admin (`admin`)
- ✅ View all customers
- ❌ Cannot create users
- ❌ Cannot view admin users list
- ✅ Cancel subscriptions
- ✅ Restore/reactivate subscriptions
- ✅ Deactivate customer accounts
- ✅ Activate customer accounts
- ✅ View all notifications

### Viewer (`viewer`)
- ✅ View all customers (read-only)
- ❌ Cannot create users
- ❌ Cannot view admin users list
- ❌ Cannot perform any actions
- ✅ View notifications

## Creating Users

### Creating a Super Admin

**IMPORTANT: Super Admin is a system-only role and can only be created using the script during initial setup.**

```bash
cd soulmate_backend
# super_admin is the default, so you can omit the role parameter
node scripts/createAdmin.js superadmin yourpassword123
# Or explicitly specify:
node scripts/createAdmin.js superadmin yourpassword123 super_admin
```

**Note:** Super admin cannot be created through the CRM interface. It is a system-only role that should only be created once during initial setup.

### Creating an Admin User

**Using the script:**
```bash
cd soulmate_backend
# Must explicitly specify 'admin' role
node scripts/createAdmin.js adminuser password123 admin
```

**Note:** The "Create User" feature has been removed from the CRM interface. All users must be created using the script.

### Creating a Viewer User

**Using the script:**
```bash
cd soulmate_backend
node scripts/createAdmin.js vieweruser password123 viewer
```

## Backend Restrictions

The following API endpoints are restricted to **super_admin only**:

- `POST /api/admin/customers/cancel-subscription` - Cancel customer subscription
- `POST /api/admin/customers/restore-subscription` - Restore cancelled subscription
- `POST /api/admin/customers/deactivate` - Deactivate customer account
- `POST /api/admin/customers/activate` - Activate customer account

All other endpoints are accessible to admin and super_admin roles.

## Frontend Behavior

### For Super Admin:
- All action buttons are visible and functional
- Can see "Cancel Subscription", "Deactivate", "Activate" buttons
- Can create users with any role (admin, viewer, super_admin)

### For Admin:
- Action buttons are hidden or disabled
- Can view customer details
- Can create users (admin and viewer roles only)
- Sees message: "Limited access - Only super admin can perform customer actions"

### For Viewer:
- All action buttons are hidden
- Can only view customer information
- Cannot create users
- Sees message: "View only - Actions are not available for viewers"

## Security Notes

1. **Super Admin Creation**: Super admin is a system-only role and cannot be created through the CRM interface or API. It can only be created using the script during initial setup. This ensures there is only one super admin in the system.

2. **Default Role**: When creating a user using the script without specifying a role, it defaults to `super_admin`. However, super admin creation is restricted to script-only.

3. **Role Validation**: The backend validates roles on all protected endpoints to ensure proper access control.

4. **User Creation**: The "Create User" feature has been removed from the CRM interface. All users must be created using the script for better security and control.

## Migration Guide

If you have existing admin users and want to upgrade one to super_admin:

1. Connect to your database
2. Update the user's role:
   ```sql
   UPDATE admin_users 
   SET role = 'super_admin', updated_at = NOW() 
   WHERE username = 'your_username';
   ```

Or use the createAdmin script to create a new super admin user.

## Testing Roles

1. Create a super admin user
2. Log in as super admin - verify all actions are available
3. Create an admin user
4. Log in as admin - verify actions are restricted
5. Create a viewer user
6. Log in as viewer - verify read-only access

