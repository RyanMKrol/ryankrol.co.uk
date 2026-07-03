import '../styles/globals.css'
import MatrixLayout from '../components/MatrixLayout'
import Footer from '../components/Footer'
import useKonamiCode from '../hooks/useKonamiCode'

export default function App({ Component, pageProps }) {
  const matrixActive = useKonamiCode();

  return (
    <MatrixLayout active={matrixActive}>
      <Component {...pageProps} />
      <Footer />
    </MatrixLayout>
  )
}
