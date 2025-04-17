"use server"

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth, getServerSession } from "@/lib/auth";

export default async function AuthProvider({
    children,
    
  }: Readonly<{
    children: React.ReactNode;
  }>)
{
      const session = await getServerSession()
    
      console.log(session)
    
      if(!session)
      {
        redirect('/');
      }
      /*else
      {
        redirect('/private');
      }*/
      
    return (<>{children}</>)
}