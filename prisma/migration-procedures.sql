
--RUN npx prisma migrate dev --create-only
--COPY THESE ITEMS INTO THE NEWLY CREATED FILE AT THE TOP

CREATE OR REPLACE FUNCTION public.get_user_permissions("userId" text)
    RETURNS TABLE("userId" text, "memberId" integer, "memberRoleId" integer, "roleId" integer, "roleName" text, "resourceId" integer, "resourceName" text, "actionName" text) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

    AS $BODY$
    --Test
    SELECT 	member."userId",member."memberId", member_role."memberRoleId", 
        role."roleId", role.name, resource."resourceId", resource.name, action.name
    FROM public.member
    LEFT JOIN public.member_role ON member_role."memberId" = member."memberId"
    LEFT JOIN public.role ON role."roleId" = member_role."roleId"
    LEFT JOIN public.role_resource_action ON role_resource_action."roleId" = role."roleId"
    LEFT JOIN public.resource ON resource."resourceId" = role_resource_action."resourceId"
    LEFT JOIN public.action ON action."actionId" = role_resource_action."actionId"
    WHERE public.member."userId" = "userId";
    $BODY$;

    ALTER FUNCTION public.get_user_permissions_manual(text)
    OWNER TO prisma;