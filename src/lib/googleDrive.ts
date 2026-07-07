import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, Auth } from "firebase/auth";

let authInstance: Auth | null = null;
let providerInstance: GoogleAuthProvider | null = null;

// Lazy initialization of Firebase Auth to prevent crash if firebase-applet-config.json is not yet created
export async function getFirebaseAuth(): Promise<{ auth: Auth; provider: GoogleAuthProvider }> {
  if (authInstance && providerInstance) {
    return { auth: authInstance, provider: providerInstance };
  }

  try {
    // Fetch firebase-applet-config.json dynamically at runtime to prevent Vite compile-time resolution errors
    const response = await fetch("/firebase-applet-config.json");
    if (!response.ok) {
      throw new Error("Could not load firebase-applet-config.json");
    }
    const config = await response.json();
    
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    authInstance = getAuth(app);
    providerInstance = new GoogleAuthProvider();
    providerInstance.addScope("https://www.googleapis.com/auth/drive.file");
    
    return { auth: authInstance, provider: providerInstance };
  } catch (error) {
    console.error("Firebase is not yet configured or config is missing:", error);
    throw new Error("Firebase Auth config is missing. Please complete the Google Drive setup in the Co-pilot assistant card.");
  }
}

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory.
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = async (
  onAuthSuccess: (user: User, token: string) => void,
  onAuthFailure: () => void
) => {
  try {
    const { auth } = await getFirebaseAuth();
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          onAuthSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          onAuthFailure();
        }
      } else {
        cachedAccessToken = null;
        onAuthFailure();
      }
    });
  } catch (err) {
    console.warn("Auth initialization delayed until setup completes:", err);
    onAuthFailure();
    return () => {};
  }
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const { auth, provider } = await getFirebaseAuth();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google Workspace Sign-In");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  try {
    const { auth } = await getFirebaseAuth();
    await auth.signOut();
  } catch (err) {
    console.error("Error during sign out:", err);
  } finally {
    cachedAccessToken = null;
  }
};

/**
 * Uploads a generated presentation Blob to Google Drive.
 */
export async function uploadPresentationToGoogleDrive(
  blob: Blob,
  fileName: string,
  accessToken: string
): Promise<{ fileId: string; webViewLink: string }> {
  // Step 1: Create metadata
  const metadataResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: fileName,
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }),
  });

  if (!metadataResponse.ok) {
    const errorText = await metadataResponse.text();
    throw new Error(`Failed to create Google Drive metadata: ${errorText}`);
  }

  const fileMetadata = await metadataResponse.json();
  const fileId = fileMetadata.id;

  // Step 2: Upload media
  const uploadResponse = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      },
      body: blob,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Failed to upload file content to Google Drive: ${errorText}`);
  }

  // Step 3: Fetch webViewLink to let user open the presentation in Google Slides/Drive
  const getMetadataResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!getMetadataResponse.ok) {
    const errorText = await getMetadataResponse.text();
    throw new Error(`Failed to retrieve file sharing link from Google Drive: ${errorText}`);
  }

  const completeMetadata = await getMetadataResponse.json();
  return {
    fileId,
    webViewLink: completeMetadata.webViewLink,
  };
}
