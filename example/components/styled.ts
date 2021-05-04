import styled from 'styled-components'

export const IconButton = styled.button`
  background: transparent;
  display: flex;
  border: none;
  align-items: center;
  font-size: 32px;
  padding: 8px;
  color: var(--color-text);
  cursor: pointer;
  border-radius: 4px;
  outline: none;

  &:disabled {
    opacity: 0.3;
  }

  &:hover {
    background-color: var(--color-hover);
  }
`
