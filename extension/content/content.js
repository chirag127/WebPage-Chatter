// WebPage Chatter - Content Script

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractContent') {
    // Extract content from the webpage
    const pageContent = extractPageContent();
    sendResponse(pageContent);
  }
  return true; // Keep the message channel open for async response
});

/**
 * Extract content from the current webpage
 * @returns {Object} - Object containing the extracted content
 */
function extractPageContent() {
  try {
    // Extract page title
    const pageTitle = document.title || '';
    
    // Extract page URL
    const pageUrl = window.location.href || '';
    
    // Extract meta tags
    const metaTags = extractMetaTags();
    
    // Extract visible text content
    const textContent = extractVisibleText();
    
    // Extract image alt text
    const imageAltText = extractImageAltText();
    
    // Combine all content into a structured format
    const combinedContent = formatExtractedContent(pageTitle, pageUrl, metaTags, textContent, imageAltText);
    
    return {
      success: true,
      content: combinedContent
    };
  } catch (error) {
    console.error('Error extracting page content:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract meta tags from the document
 * @returns {Object} - Object containing meta tag information
 */
function extractMetaTags() {
  const metaTags = {};
  
  // Extract description
  const descriptionTag = document.querySelector('meta[name="description"]');
  if (descriptionTag) {
    metaTags.description = descriptionTag.getAttribute('content');
  }
  
  // Extract keywords
  const keywordsTag = document.querySelector('meta[name="keywords"]');
  if (keywordsTag) {
    metaTags.keywords = keywordsTag.getAttribute('content');
  }
  
  // Extract author
  const authorTag = document.querySelector('meta[name="author"]');
  if (authorTag) {
    metaTags.author = authorTag.getAttribute('content');
  }
  
  // Extract Open Graph meta tags
  const ogTitleTag = document.querySelector('meta[property="og:title"]');
  if (ogTitleTag) {
    metaTags.ogTitle = ogTitleTag.getAttribute('content');
  }
  
  const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
  if (ogDescriptionTag) {
    metaTags.ogDescription = ogDescriptionTag.getAttribute('content');
  }
  
  return metaTags;
}

/**
 * Extract visible text content from the document
 * @returns {string} - Extracted text content
 */
function extractVisibleText() {
  // Elements to exclude from text extraction
  const excludeSelectors = [
    'script',
    'style',
    'noscript',
    'iframe',
    'svg',
    'path',
    'symbol',
    'img',
    'video',
    'audio',
    'canvas',
    'code',
    'pre',
    '[aria-hidden="true"]',
    '.hidden',
    '[style*="display: none"]',
    '[style*="display:none"]',
    '[style*="visibility: hidden"]',
    '[style*="visibility:hidden"]'
  ].join(',');
  
  // Clone the body to avoid modifying the original DOM
  const bodyClone = document.body.cloneNode(true);
  
  // Remove excluded elements from the clone
  const excludedElements = bodyClone.querySelectorAll(excludeSelectors);
  excludedElements.forEach(element => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
  
  // Extract text from headings
  const headings = Array.from(bodyClone.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const headingTexts = headings.map(heading => `${heading.tagName}: ${heading.textContent.trim()}`);
  
  // Extract text from paragraphs
  const paragraphs = Array.from(bodyClone.querySelectorAll('p'));
  const paragraphTexts = paragraphs.map(p => p.textContent.trim());
  
  // Extract text from list items
  const listItems = Array.from(bodyClone.querySelectorAll('li'));
  const listItemTexts = listItems.map(li => `• ${li.textContent.trim()}`);
  
  // Extract text from tables
  const tables = Array.from(bodyClone.querySelectorAll('table'));
  const tableTexts = [];
  
  tables.forEach(table => {
    const caption = table.querySelector('caption');
    if (caption) {
      tableTexts.push(`Table: ${caption.textContent.trim()}`);
    }
    
    const rows = Array.from(table.querySelectorAll('tr'));
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const rowText = cells.map(cell => cell.textContent.trim()).join(' | ');
      tableTexts.push(rowText);
    });
  });
  
  // Combine all text elements
  const allTexts = [
    ...headingTexts,
    ...paragraphTexts,
    ...listItemTexts,
    ...tableTexts
  ];
  
  return allTexts.join('\n\n');
}

/**
 * Extract alt text from images
 * @returns {string} - Extracted image alt text
 */
function extractImageAltText() {
  const images = Array.from(document.querySelectorAll('img[alt]:not([alt=""])'));
  const altTexts = images.map(img => {
    const alt = img.getAttribute('alt').trim();
    return `Image: ${alt}`;
  });
  
  return altTexts.join('\n');
}

/**
 * Format extracted content into a structured string
 * @param {string} title - Page title
 * @param {string} url - Page URL
 * @param {Object} metaTags - Meta tag information
 * @param {string} textContent - Visible text content
 * @param {string} imageAltText - Image alt text
 * @returns {string} - Formatted content string
 */
function formatExtractedContent(title, url, metaTags, textContent, imageAltText) {
  let formattedContent = '';
  
  // Add page title and URL
  formattedContent += `TITLE: ${title}\n\n`;
  formattedContent += `URL: ${url}\n\n`;
  
  // Add meta tags
  formattedContent += 'META INFORMATION:\n';
  if (metaTags.description) {
    formattedContent += `Description: ${metaTags.description}\n`;
  }
  if (metaTags.keywords) {
    formattedContent += `Keywords: ${metaTags.keywords}\n`;
  }
  if (metaTags.author) {
    formattedContent += `Author: ${metaTags.author}\n`;
  }
  if (metaTags.ogTitle) {
    formattedContent += `OG Title: ${metaTags.ogTitle}\n`;
  }
  if (metaTags.ogDescription) {
    formattedContent += `OG Description: ${metaTags.ogDescription}\n`;
  }
  formattedContent += '\n';
  
  // Add text content
  formattedContent += 'PAGE CONTENT:\n';
  formattedContent += textContent;
  formattedContent += '\n\n';
  
  // Add image alt text if available
  if (imageAltText) {
    formattedContent += 'IMAGE DESCRIPTIONS:\n';
    formattedContent += imageAltText;
    formattedContent += '\n\n';
  }
  
  return formattedContent;
}
