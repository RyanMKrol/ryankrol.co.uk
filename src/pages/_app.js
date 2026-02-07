import '../styles/globals.css'
import MatrixLayout from '../components/MatrixLayout'

export default function App({ Component, pageProps }) {
  return (
    <MatrixLayout>
      <Component {...pageProps} />
    </MatrixLayout>
  )
}
