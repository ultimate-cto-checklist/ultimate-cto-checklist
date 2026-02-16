# Audit Workflow

## Running an Audit

1. Open Claude Code in this workspace directory
2. Run `/audit-start acme-api` to begin
3. Claude walks through each item interactively
4. For each item, Claude:
   - Explains what to check
   - Runs automated verification where possible
   - Asks you to confirm the result
   - Records evidence and notes
5. Run `/audit-status` anytime to check progress
6. Run `/audit-summary` when done for a full report

## Tips

- Use `/audit-section 01-git-repo-setup` to focus on one area
- Use `/audit-skip` for items you'll come back to
- Use `/audit-continue` to resume after a break
- Results are saved as markdown files in `audits/`
