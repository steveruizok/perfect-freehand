import * as React from 'react'
import styled, { css, keyframes, Keyframes } from 'styled-components'

const flyIn = keyframes`
  from {
    opacity: 0;
    visibility: visible;
    transform: translateX(-50%) translateY(-5px);
  }
  to {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0px);
  }
`

const fadeOut = keyframes`
  from {
    opacity: 1;
    visibility: visible;
  }
  to {
    opacity: 0;
    visibility: hidden;
  }
`

const animation = (props: {
  animation: Keyframes
  animationLength: number
}) => {
  return css`
    animation: ${props.animation} ${props.animationLength}ms forwards ease-out;
  `
}

const AlertWrapper = styled.div`
  position: relative;
  overflow: inherit;
`

const StyledAlert = styled.div`
  position: absolute;
  margin-top: 5px;
  padding: 4px 10px;
  width: 100px;
  z-index: 10;
  background-color: var(--color-alert-background);
  color: var(--color-alert-text);
  font-weight: 500;
  text-align: center;
  border-radius: 3px;
  font-size: 14px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  visibility: hidden;

  ${animation};
`
interface AlertProps {
  children: React.ReactNode
  animationLength: number
  visibilityDuration: number
  alertText: { error: boolean; message: string }
  onFinish: () => void
}

export default function Alert({
  children,
  animationLength,
  visibilityDuration,
  alertText,
  onFinish,
}: AlertProps) {
  const [alertFading, setAlertFading] = React.useState(false)

  React.useEffect(() => {
    if (alertText) {
      setTimeout(
        () => setAlertFading(true),
        visibilityDuration - animationLength
      )
      setTimeout(() => {
        onFinish()
        setAlertFading(false)
      }, visibilityDuration)
    }
  }, [alertText])

  return (
    <AlertWrapper>
      {children}
      {alertText ? (
        <StyledAlert
          aria-live="polite"
          role="alert"
          animation={alertFading ? fadeOut : flyIn}
          animationLength={animationLength}
        >
          {alertText.message}
        </StyledAlert>
      ) : null}
    </AlertWrapper>
  )
}
