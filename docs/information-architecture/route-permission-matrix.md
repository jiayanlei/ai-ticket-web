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
- `system:tenant:update`
