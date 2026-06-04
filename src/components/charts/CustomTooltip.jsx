import { Box, Typography } from "@mui/material";

/**
 * Shared recharts tooltip — readable in BOTH light and dark mode.
 *
 * Uses MUI theme tokens (background.paper / text colors / divider) instead of
 * a hard-coded dark background, so the text is never invisible. Pass it to any
 * recharts chart via:  <Tooltip content={<CustomTooltip />} />
 *
 * Optional `formatter` matches recharts' signature: (value, name, entry) =>
 *   value  OR  [value, name].  Use it for units, e.g. v => `${v} bytes`.
 */
export default function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        px: 1.25,
        py: 1,
        fontSize: "0.8rem",
        minWidth: 110,
        boxShadow: 3,
      }}
    >
      {label !== undefined && label !== null && label !== "" && (
        <Typography variant="caption" display="block" fontWeight={700} mb={0.5} color="text.primary">
          {label}
        </Typography>
      )}
      {payload.map((p, i) => {
        const res = formatter ? formatter(p.value, p.name, p) : p.value;
        const value = Array.isArray(res) ? res[0] : res;
        const name = Array.isArray(res) ? res[1] : p.name;
        const dot = p.color || p.payload?.fill || p.fill;
        return (
          <Box key={i} display="flex" alignItems="center" gap={1}>
            {dot && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: dot, flexShrink: 0 }} />}
            <Typography variant="caption" color="text.primary">
              {name != null && name !== "" ? `${name}: ` : ""}
              <strong>{value}</strong>
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
