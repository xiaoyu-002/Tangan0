const escapeHtml = (value = '') => {
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return String(value).replace(/[&<>"']/g, (char) => htmlEntities[char])
}

const splitTableRow = (line = '') => {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

const isTableDivider = (line = '') => {
  const cells = splitTableRow(line)
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

const renderInlineMarkdown = (value = '') => {
  const protectedHtml = []
  const stash = (html) => {
    const index = protectedHtml.length
    protectedHtml.push(html)
    return `\u0000MD${index}\u0000`
  }

  let html = escapeHtml(value).replace(/`([^`]+)`/g, (_, code) => {
    return stash(`<code>${code}</code>`)
  })

  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
    return stash(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`)
  })
  html = html.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>')
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([\s\S]+?)__/g, '<strong>$1</strong>')
  html = html.replace(/~~([\s\S]+?)~~/g, '<del>$1</del>')
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  html = html.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')

  return html.replace(/\u0000MD(\d+)\u0000/g, (_, index) => protectedHtml[Number(index)] || '')
}

export const renderMarkdown = (source = '') => {
  const lines = String(source || '').replace(/\r\n/g, '\n').split('\n')
  const html = []
  let paragraph = []
  let listType = ''
  let inCodeBlock = false
  let codeLanguage = ''
  let codeLines = []
  let quoteLines = []

  const closeParagraph = () => {
    if (!paragraph.length) return
    html.push(`<p>${renderInlineMarkdown(paragraph.join('\n')).replace(/\n/g, '<br>')}</p>`)
    paragraph = []
  }

  const closeList = () => {
    if (!listType) return
    html.push(`</${listType}>`)
    listType = ''
  }

  const closeQuote = () => {
    if (!quoteLines.length) return
    html.push(`<blockquote>${quoteLines.map(renderInlineMarkdown).join('<br>')}</blockquote>`)
    quoteLines = []
  }

  const openList = (type) => {
    closeQuote()
    closeParagraph()
    if (listType === type) return
    closeList()
    listType = type
    html.push(`<${type}>`)
  }

  const closeCodeBlock = () => {
    const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : ''
    html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
    inCodeBlock = false
    codeLanguage = ''
    codeLines = []
  }

  const closeFlowBlocks = () => {
    closeParagraph()
    closeQuote()
    closeList()
  }

  const renderTable = (startIndex) => {
    const headers = splitTableRow(lines[startIndex])
    const alignments = splitTableRow(lines[startIndex + 1]).map((cell) => {
      if (cell.startsWith(':') && cell.endsWith(':')) return 'center'
      if (cell.endsWith(':')) return 'right'
      return 'left'
    })
    const bodyRows = []
    let cursor = startIndex + 2

    while (cursor < lines.length && /^\s*\|?.+\|.+/.test(lines[cursor]) && !isTableDivider(lines[cursor])) {
      bodyRows.push(splitTableRow(lines[cursor]))
      cursor += 1
    }

    const headerHtml = headers
      .map((cell, index) => `<th style="text-align:${alignments[index] || 'left'}">${renderInlineMarkdown(cell)}</th>`)
      .join('')
    const bodyHtml = bodyRows
      .map((row) => `<tr>${row.map((cell, index) => `<td style="text-align:${alignments[index] || 'left'}">${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`)
      .join('')

    html.push(`<div class="markdown-table-wrap"><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`)
    return cursor
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const fenceMatch = line.match(/^```([\w-]*)\s*$/)

    if (fenceMatch) {
      if (inCodeBlock) closeCodeBlock()
      else {
        closeFlowBlocks()
        inCodeBlock = true
        codeLanguage = fenceMatch[1] || ''
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    if (!line.trim()) {
      closeFlowBlocks()
      continue
    }

    if (/^\s*\|?.+\|.+/.test(line) && isTableDivider(lines[index + 1] || '')) {
      closeFlowBlocks()
      index = renderTable(index) - 1
      continue
    }

    if (/^\s*---+\s*$/.test(line)) {
      closeFlowBlocks()
      html.push('<hr>')
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      closeFlowBlocks()
      const level = Math.min(headingMatch[1].length, 6)
      html.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`)
      continue
    }

    const quoteMatch = line.match(/^>\s?(.+)$/)
    if (quoteMatch) {
      closeParagraph()
      closeList()
      quoteLines.push(quoteMatch[1])
      continue
    }

    const orderedMatch = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (orderedMatch) {
      openList('ol')
      html.push(`<li>${renderInlineMarkdown(orderedMatch[1])}</li>`)
      continue
    }

    const unorderedMatch = line.match(/^\s*[-*]\s+(.+)$/)
    if (unorderedMatch) {
      openList('ul')
      const checkboxMatch = unorderedMatch[1].match(/^\[( |x|X)\]\s+(.+)$/)
      if (checkboxMatch) {
        const checked = checkboxMatch[1].toLowerCase() === 'x' ? ' checked' : ''
        html.push(`<li class="task-list-item-md"><input type="checkbox" disabled${checked}>${renderInlineMarkdown(checkboxMatch[2])}</li>`)
      } else {
        html.push(`<li>${renderInlineMarkdown(unorderedMatch[1])}</li>`)
      }
      continue
    }

    paragraph.push(line.trim())
  }

  if (inCodeBlock) closeCodeBlock()
  closeFlowBlocks()

  return html.join('')
}
