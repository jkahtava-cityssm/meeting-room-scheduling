
import AuthProvider from "../component/AuthProvider"

export default async function Home() {

  return (
    <AuthProvider><div> 
      PRIVATE
    </div></AuthProvider>)
}