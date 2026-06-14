import { Box, Pagination, Typography } from "@mui/material";

// Centered pager shown below a table. Renders nothing when there's a single page.
export default function TablePager({ page, count, onChange, total, perPage = 10 }) {
  if (!count || count <= 1) return null;
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" p={2} flexWrap="wrap" gap={1}>
      {total != null ? (
        <Typography variant="caption" color="text.secondary">
          Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
        </Typography>
      ) : <span />}
      <Pagination count={count} page={page} onChange={(_, p) => onChange(p)} color="primary" size="small" />
    </Box>
  );
}
