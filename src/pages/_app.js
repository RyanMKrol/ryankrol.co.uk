import '../styles/globals.css'
import MatrixLayout from '../components/MatrixLayout'
import useKonamiCode from '../hooks/useKonamiCode'
import useTheme from '../hooks/useTheme'

export default function App({ Component, pageProps }) {
  const matrixActive = useKonamiCode();
  // Initialises data-* attributes from localStorage + wires up OS colour-scheme listener.
  // matrix-active class is a separate overlay that works on top of any data-theme.
  useTheme();

  return (
    <MatrixLayout active={matrixActive}>
      <Component {...pageProps} />
    </MatrixLayout>
  )
}
