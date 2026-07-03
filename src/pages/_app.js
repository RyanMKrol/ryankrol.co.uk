import '../styles/globals.css'
import MatrixLayout from '../components/MatrixLayout'
import useKonamiCode from '../hooks/useKonamiCode'

export default function App({ Component, pageProps }) {
  const matrixActive = useKonamiCode();

  return (
    <MatrixLayout active={matrixActive}>
      <Component {...pageProps} />
    </MatrixLayout>
  )
}
