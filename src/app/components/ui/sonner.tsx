import { Toaster as Sonner, type ToasterProps } from 'sonner';

const toasterStyle = {
  '--normal-bg': '#FFFFFF',
  '--normal-text': '#0F1E32',
  '--normal-border': '#D6DEE8',
  '--success-bg': '#EBF5FF',
  '--success-text': '#0F1E32',
  '--success-border': '#B5D6FF',
  '--error-bg': '#FFF2EF',
  '--error-text': '#0F1E32',
  '--error-border': '#F3C3B8',
} as React.CSSProperties;

export function Toaster(props: ToasterProps) {
  return <Sonner className="toaster group" theme="light" style={toasterStyle} {...props} />;
}
