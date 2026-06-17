# Route Permission Matrix

The application keeps backend-style dynamic menus and frontend permission checks.

## Permission Pattern

- View: `{domain}:{resource}:view`
- Create: `{domain}:{resource}:create`
- Update: `{domain}:{resource}:update`
- Delete: `{domain}:{resource}:delete`
- Export: `{domain}:{resource}:export`
- Approve: `{domain}:{resource}:approve`
- Operate: `{domain}:{resource}:operate`

## Sensitive Permission Examples

- `service:call:monitor`
- `service:call:barge`
- `service:call:disconnect`
- `ai:model:route`
- `ai:model:budget`
- `system:audit:export`
- `tenant:center:update`

## Tenant Center Permissions

Tenant permissions apply to the independent `/tenants` route.

- `tenant:center:view`: view tenant list and details.
- `tenant:center:create`: create tenant and initialize default settings.
- `tenant:center:update`: update tenant base info and business configuration.
- `tenant:center:status`: enable, freeze, disable, restore, or archive tenants.
- `tenant:center:member`: manage tenant members and invitations.
- `tenant:center:permission`: manage tenant roles, menu permissions, action permissions, and data scopes.
- `tenant:center:audit`: view tenant audit logs.
- `tenant:center:export`: export tenant data or tenant audit records.
