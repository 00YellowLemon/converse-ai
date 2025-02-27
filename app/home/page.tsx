tsx
import Sidebar from "@/components/Sidebar";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionContext } from "@/lib/session-context";
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, onSnapshot, query, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  online?: boolean;
}
export default function Home() {
  const { user, loading, firebaseClient } = useContext(SessionContext);
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);

  useEffect(() => { 
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <>
        <div>
          <p>Loading...</p>
        </div>
        <Sidebar/>
      </>);
  }

  if (!user) {
    return null;
  }

  useEffect(() => {
    const usersCollection = collection(db, "users");
    const userDocRef = doc(usersCollection, user.uid);
    const setUserData = async () => {
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          online: true,
        },{ merge: true })
    };
    setUserData();

    const unsubscribe = onSnapshot(query(usersCollection), (snapshot) => {
      const updatedUsers: UserData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: data.uid,
          displayName: data.displayName,
          email: data.email,
          photoURL: data.photoURL,
          online: data.online,
        } as UserData;
      });

      setUsers(updatedUsers);
    });

    return () => unsubscribe();
  }, [user,firebaseClient]);

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Welcome, {user.displayName}!
        </h1>
        <p className="text-center mb-8">
            User List
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((userData) => (
            <Card
              key={userData.uid}
              className="border-2 border-gray-300 hover:border-blue-500 transition-all duration-300"
            >
              <CardHeader>
                <CardTitle className="font-semibold">{userData.displayName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Email: {userData.email}</p>
                <p className="text-sm text-gray-600">Online: {userData.online ? "Yes" : "No"}</p>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
