"use strict";

const ruleDefinition = {
  rules: {
    "no-inline-for-verification-hook": {
      meta: {
        type: "problem",
        docs: {
          description: "Warn when an inline object is passed to useVerifySessionRequirement",
          recommended: false,
        },
        schema: [
          {
            type: "object",
            properties: {
              hookName: { type: "string" },
              argIndex: { type: "number" },
            },
            additionalProperties: false,
          },
        ],
        messages: {
          inlineObject:
            "Do not pass an inline object to {{hookName}}. Define it as a constant or memoize with useMemo.",
        },
      },

      create(context) {
        const opts = context.options[0] || {};
        const HOOK_NAME = opts.hookName || "useVerifySessionRequirement";
        const ARG_INDEX = Number.isInteger(opts.argIndex) ? opts.argIndex : 1;

        function isTargetHookCall(node) {
          return node.callee && node.callee.type === "Identifier" && node.callee.name === HOOK_NAME;
        }

        function isInline(node) {
          if (!node) return false;
          return node.type === "ObjectExpression" || node.type === "ArrayExpression" || node.type === "NewExpression";
        }

        return {
          CallExpression(node) {
            if (!isTargetHookCall(node)) return;

            const args = node.arguments || [];
            const targetArg = args[ARG_INDEX];
            if (!targetArg) return;
            if (!isInline(targetArg)) return;

            context.report({
              node: targetArg,
              messageId: "inlineObject",
              data: { hookName: HOOK_NAME },
            });
          },
        };
      },
    },
  },
};

export default ruleDefinition;
