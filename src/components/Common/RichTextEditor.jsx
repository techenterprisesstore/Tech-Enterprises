import { useRef, useEffect } from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { Bold, Italic, Link as LinkIcon, List } from 'lucide-react';

/**
 * Simple rich text editor with toolbar: Bold, Italic, Link, Bullet list.
 * Value is HTML string. Uses contentEditable + document.execCommand.
 */
const RichTextEditor = ({ value = '', onChange, placeholder = 'Write here...', minHeight = 140, sx = {} }) => {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    const el = editorRef.current;
    if (!el || !onChange) return;
    isInternalChange.current = true;
    onChange(el.innerHTML || '');
  };

  const exec = (command, valueArg = null) => {
    document.execCommand(command, false, valueArg);
    editorRef.current?.focus();
    handleInput();
  };

  const handleLink = () => {
    const url = window.prompt('Enter URL:', 'https://');
    if (url != null && url.trim()) {
      exec('createLink', url.trim());
    }
  };

  return (
    <Box sx={{ ...sx }}>
      <ToggleButtonGroup
        size="small"
        sx={{
          mb: 0.5,
          '& .MuiToggleButtonGroup-grouped': { border: '1px solid', borderColor: 'divider', borderRadius: 1 },
        }}
      >
        <Tooltip title="Bold">
          <ToggleButton value="bold" onClick={() => exec('bold')} aria-label="Bold">
            <Bold size={18} />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Italic">
          <ToggleButton value="italic" onClick={() => exec('italic')} aria-label="Italic">
            <Italic size={18} />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Insert link">
          <ToggleButton value="link" onClick={handleLink} aria-label="Link">
            <LinkIcon size={18} />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Bullet list">
          <ToggleButton value="bullet" onClick={() => exec('insertUnorderedList')} aria-label="Bullet list">
            <List size={18} />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      <Box
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        sx={{
          minHeight,
          maxHeight: 280,
          overflowY: 'auto',
          p: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          fontSize: '0.875rem',
          lineHeight: 1.6,
          outline: 'none',
          '&:focus': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.25)',
          },
          '&:empty:before': {
            content: 'attr(data-placeholder)',
            color: 'text.disabled',
          },
          '& ul': { margin: '0.25em 0', paddingLeft: 24 },
          '& li': { marginBottom: 2 },
          '& a': { color: 'primary.main', textDecoration: 'underline' },
        }}
      />
    </Box>
  );
};

export default RichTextEditor;
