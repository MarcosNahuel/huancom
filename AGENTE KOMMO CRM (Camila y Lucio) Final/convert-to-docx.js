const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, BorderStyle, WidthType, AlignmentType } = require('docx');

const markdown = fs.readFileSync('AUDITORIA_SISTEMA.md', 'utf8');
const lines = markdown.split('\n');

const children = [];
let inCodeBlock = false;
let codeContent = [];
let inTable = false;
let tableRows = [];

function parseTableRow(line) {
    return line.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
}

function createTable(rows) {
    if (rows.length < 2) return null;

    const headerRow = rows[0];
    const dataRows = rows.slice(2); // Skip separator row

    const tableChildren = [];

    // Header row
    tableChildren.push(new TableRow({
        children: headerRow.map(cell => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: cell, bold: true, size: 22 })],
                alignment: AlignmentType.CENTER
            })],
            shading: { fill: "E8E8E8" }
        }))
    }));

    // Data rows
    dataRows.forEach(row => {
        if (row.length > 0) {
            tableChildren.push(new TableRow({
                children: row.map(cell => new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: cell, size: 22 })]
                    })]
                }))
            }));
        }
    });

    return new Table({
        rows: tableChildren,
        width: { size: 100, type: WidthType.PERCENTAGE }
    });
}

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
        if (inCodeBlock) {
            children.push(new Paragraph({
                children: [new TextRun({
                    text: codeContent.join('\n'),
                    font: 'Courier New',
                    size: 20
                })],
                shading: { fill: "F5F5F5" },
                spacing: { before: 100, after: 100 }
            }));
            codeContent = [];
            inCodeBlock = false;
        } else {
            inCodeBlock = true;
        }
        continue;
    }

    if (inCodeBlock) {
        codeContent.push(line);
        continue;
    }

    // Tables
    if (line.startsWith('|')) {
        if (!inTable) {
            inTable = true;
            tableRows = [];
        }
        tableRows.push(parseTableRow(line));
        continue;
    } else if (inTable) {
        const table = createTable(tableRows);
        if (table) children.push(table);
        children.push(new Paragraph({ children: [] })); // Space after table
        inTable = false;
        tableRows = [];
    }

    // Headings
    if (line.startsWith('# ')) {
        children.push(new Paragraph({
            children: [new TextRun({ text: line.substring(2), bold: true, size: 36 })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
        }));
        continue;
    }

    if (line.startsWith('## ')) {
        children.push(new Paragraph({
            children: [new TextRun({ text: line.substring(3), bold: true, size: 32 })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 }
        }));
        continue;
    }

    if (line.startsWith('### ')) {
        children.push(new Paragraph({
            children: [new TextRun({ text: line.substring(4), bold: true, size: 28 })],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
        }));
        continue;
    }

    if (line.startsWith('#### ')) {
        children.push(new Paragraph({
            children: [new TextRun({ text: line.substring(5), bold: true, size: 24 })],
            heading: HeadingLevel.HEADING_4,
            spacing: { before: 150, after: 75 }
        }));
        continue;
    }

    // Horizontal rule
    if (line.startsWith('---')) {
        children.push(new Paragraph({
            children: [new TextRun({ text: '─'.repeat(80), color: "CCCCCC" })],
            spacing: { before: 200, after: 200 }
        }));
        continue;
    }

    // Bold text and regular text
    if (line.trim()) {
        const textRuns = [];
        let remaining = line;

        // Parse bold markers
        const boldRegex = /\*\*([^*]+)\*\*/g;
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                textRuns.push(new TextRun({ text: line.substring(lastIndex, match.index), size: 22 }));
            }
            textRuns.push(new TextRun({ text: match[1], bold: true, size: 22 }));
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < line.length) {
            textRuns.push(new TextRun({ text: line.substring(lastIndex), size: 22 }));
        }

        if (textRuns.length === 0) {
            textRuns.push(new TextRun({ text: line, size: 22 }));
        }

        children.push(new Paragraph({
            children: textRuns,
            spacing: { after: 100 }
        }));
    } else {
        children.push(new Paragraph({ children: [] }));
    }
}

// Handle any remaining table
if (inTable && tableRows.length > 0) {
    const table = createTable(tableRows);
    if (table) children.push(table);
}

const doc = new Document({
    sections: [{
        properties: {},
        children: children
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('AUDITORIA_SISTEMA.docx', buffer);
    console.log('DOCX creado exitosamente: AUDITORIA_SISTEMA.docx');
});
