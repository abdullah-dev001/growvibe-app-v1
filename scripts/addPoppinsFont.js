const fs = require('fs');
const path = require('path');

// Files to process
const filesToProcess = [
  'app',
  'components'
];

// Recursively find all .jsx files
function findJsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      findJsxFiles(filePath, fileList);
    } else if (file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Add fontFamily to Text styles that don't have it
function addPoppinsToStyles(content) {
  let modified = content;
  
  // Pattern to match style definitions in StyleSheet.create
  // Match styles that have fontSize, color, fontWeight, etc but no fontFamily
  const stylePattern = /(\w+):\s*\{([^}]*fontSize[^}]*)(?![^}]*fontFamily)([^}]*)\}/g;
  
  // More specific: find style objects that have text-related properties but no fontFamily
  const textStylePattern = /(\w+(?:Text|Title|Label|Subtitle|Header|Name|Description|Body|Message|Content|Value|Count|Badge|Button|Link|Error|Success|Info|Warning|Placeholder|Hint|Caption|Small|Large|Medium|Bold|Regular|SemiBold|Light|Thin|ExtraBold|ExtraLight|Black|Italic|Oblique|Normal|Heavy|Ultra|Display|Headline|Subheadline|Callout|Footnote|Caption1|Caption2|Body1|Body2|Title1|Title2|Title3|LargeTitle|Footnote1|Footnote2|Footnote3|Footnote4|Footnote5|Footnote6|Footnote7|Footnote8|Footnote9|Footnote10|Footnote11|Footnote12|Footnote13|Footnote14|Footnote15|Footnote16|Footnote17|Footnote18|Footnote19|Footnote20|Footnote21|Footnote22|Footnote23|Footnote24|Footnote25|Footnote26|Footnote27|Footnote28|Footnote29|Footnote30|Footnote31|Footnote32|Footnote33|Footnote34|Footnote35|Footnote36|Footnote37|Footnote38|Footnote39|Footnote40|Footnote41|Footnote42|Footnote43|Footnote44|Footnote45|Footnote46|Footnote47|Footnote48|Footnote49|Footnote50)):\s*\{([^}]*)(?![^}]*fontFamily)([^}]*)\}/g;
  
  // Better approach: find all style definitions and check if they need fontFamily
  // Look for styles that have fontSize or color (likely text styles) but no fontFamily
  const lines = content.split('\n');
  const newLines = [];
  let inStyleSheet = false;
  let braceDepth = 0;
  let currentStyle = null;
  let styleStartLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect StyleSheet.create
    if (trimmed.includes('StyleSheet.create')) {
      inStyleSheet = true;
      braceDepth = 0;
      newLines.push(line);
      continue;
    }
    
    if (inStyleSheet) {
      // Count braces to track depth
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceDepth += openBraces - closeBraces;
      
      // Detect style name (e.g., "styleName: {")
      if (openBraces > 0 && trimmed.match(/^\w+:\s*\{/)) {
        currentStyle = trimmed.match(/^(\w+):/)?.[1];
        styleStartLine = i;
      }
      
      // Check if this style block has text properties but no fontFamily
      if (currentStyle && braceDepth === 1 && closeBraces > 0) {
        // Extract the style block
        let styleBlock = '';
        for (let j = styleStartLine; j <= i; j++) {
          styleBlock += lines[j] + '\n';
        }
        
        // Check if it has fontSize/color but no fontFamily
        const hasTextProperty = /fontSize|color|fontWeight|textAlign|lineHeight/.test(styleBlock);
        const hasFontFamily = /fontFamily/.test(styleBlock);
        
        if (hasTextProperty && !hasFontFamily) {
          // Add fontFamily before closing brace
          const lastLine = lines[i];
          const indent = lastLine.match(/^(\s*)/)?.[1] || '';
          const beforeBrace = lastLine.replace(/\s*\}[,;]?$/, '');
          
          // Determine appropriate Poppins variant based on fontWeight or style name
          let fontVariant = 'Poppins-Regular';
          if (/fontWeight.*[67]00|Bold|bold/.test(styleBlock) || currentStyle.toLowerCase().includes('bold')) {
            fontVariant = 'Poppins-SemiBold';
          } else if (/fontWeight.*[56]00|SemiBold|semiBold|Medium|medium/.test(styleBlock) || currentStyle.toLowerCase().includes('semi') || currentStyle.toLowerCase().includes('medium')) {
            fontVariant = 'Poppins-SemiBold';
          } else if (/fontWeight.*[45]00|Medium|medium/.test(styleBlock) || currentStyle.toLowerCase().includes('medium')) {
            fontVariant = 'Poppins-Medium';
          }
          
          // Add fontFamily
          const newLastLine = beforeBrace + (beforeBrace.endsWith(',') ? '' : ',') + '\n' + 
                             indent + `    fontFamily: "${fontVariant}",` + '\n' + 
                             indent + lastLine.match(/(\s*)(\}[,;]?)$/)?.[2] || '}';
          
          // Replace the style block
          for (let j = styleStartLine; j < i; j++) {
            newLines.push(lines[j]);
          }
          newLines.push(newLastLine);
          currentStyle = null;
          continue;
        }
      }
      
      // Reset if we've closed the StyleSheet
      if (braceDepth < 0) {
        inStyleSheet = false;
        currentStyle = null;
      }
    }
    
    if (!currentStyle || (currentStyle && braceDepth !== 1)) {
      newLines.push(line);
    }
  }
  
  return newLines.join('\n');
}

// Process all files
const rootDir = path.join(__dirname, '..');
const jsxFiles = [];

filesToProcess.forEach(dir => {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) {
    findJsxFiles(dirPath, jsxFiles);
  }
});

console.log(`Found ${jsxFiles.length} JSX files to process`);

let processed = 0;
let modified = 0;

jsxFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = addPoppinsToStyles(content);
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      modified++;
      console.log(`Modified: ${path.relative(rootDir, filePath)}`);
    }
    processed++;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nProcessed ${processed} files, modified ${modified} files`);

