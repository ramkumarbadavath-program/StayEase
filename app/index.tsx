import { Redirect } from 'expo-router';

export default function AppEntryPoint() {
  // Automatically hands off initial loading execution context over to our security guard layout.
  // This shifts the app frame cleanly into the public discovery feed or the protected dashboard stacks.
  return <Redirect href="/(public)" />;
}
