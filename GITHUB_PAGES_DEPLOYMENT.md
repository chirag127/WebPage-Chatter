# GitHub Pages Deployment Guide

This document provides instructions for deploying the WebPage Chatter landing page and privacy policy to GitHub Pages.

## Files Created

1. **Landing Page**: `index.html`
   - Responsive design with dark theme
   - Features overview, installation instructions, and usage guide
   - Links to GitHub repository and privacy policy

2. **Privacy Policy**: `privacy-policy.html`
   - Detailed information about permissions and data usage
   - Clear explanations of what data is collected and how it's used
   - User rights and contact information

3. **Icons and Assets**:
   - `landing-page-icon.svg`: SVG source for the website icon
   - `favicon.ico`: Favicon for the website
   - `icons/`: Directory containing PNG icons in various sizes

4. **Scripts**:
   - `scripts/generate-landing-page-icons.js`: Script to generate PNG icons from the SVG source

5. **Documentation**:
   - `README-gh-pages.md`: README file specifically for the GitHub Pages website
   - Updated main `README.md` with information about the GitHub Pages website

## Deployment Steps

To deploy the website to GitHub Pages:

1. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Under "Source", select "main" branch
   - Click Save

2. **Verify Deployment**:
   - After a few minutes, your site will be published at `https://chirag127.github.io/WebPage-Chatter`
   - Check that all pages and resources load correctly

3. **Update Repository Information** (Optional):
   - Add the website URL to the repository description
   - Update the repository topics to include "website" or "landing-page"

## Customization

If you need to make changes to the website:

1. **Edit HTML Files**:
   - Modify `index.html` or `privacy-policy.html` as needed
   - Update content, styles, or links

2. **Update Icons**:
   - Edit `landing-page-icon.svg` if you want to change the icon design
   - Run `node scripts/generate-landing-page-icons.js` to regenerate PNG icons

3. **Add Additional Pages**:
   - Create new HTML files in the repository root
   - Link to them from the existing pages

## Maintenance

- Keep the privacy policy up-to-date with any changes to the extension's data handling
- Update the "Last Updated" date whenever you make changes
- Ensure all links remain valid, especially to the GitHub repository and issues page

## Troubleshooting

If you encounter issues with the GitHub Pages deployment:

1. **Check Repository Settings**:
   - Verify that GitHub Pages is enabled and pointing to the correct branch
   - Check for any error messages in the GitHub Pages section of the repository settings

2. **Validate HTML**:
   - Use an HTML validator to check for any syntax errors
   - Fix any issues and commit the changes

3. **Check Resources**:
   - Ensure all referenced resources (CSS, images, etc.) are available
   - Check for any 404 errors in the browser console

4. **Contact GitHub Support**:
   - If problems persist, refer to GitHub's documentation or contact support

---

Last Updated: May 18, 2025
