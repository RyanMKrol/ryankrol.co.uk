import '../styles/globals.css'
import MatrixLayout from '../components/MatrixLayout'
import Header from '../components/Header'
import Footer from '../components/Footer'
import useKonamiCode from '../hooks/useKonamiCode'

export default function App({ Component, pageProps }) {
  const matrixActive = useKonamiCode();

  return (
    <MatrixLayout active={matrixActive}>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </MatrixLayout>
  )
}
