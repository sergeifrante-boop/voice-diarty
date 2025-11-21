import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { getToken } from "./lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import EntryDetail from "@/pages/EntryDetail";
import Calendar from "@/pages/Calendar";
import TagCloud from "@/pages/TagCloud";
import Profile from "@/pages/Profile";
import NotesSplitView from "@/pages/NotesSplitView";
import NotesListView from "@/pages/NotesListView";

// Protected route wrapper component
function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function ProtectedComponent(props: T) {
    const token = getToken();

    if (!token) {
      return <Redirect to="/login" />;
    }

    return <Component {...props} />;
  };
}

// Create protected versions of components
const ProtectedHome = withAuth(Home);
const ProtectedEntryDetail = withAuth(EntryDetail);
const ProtectedCalendar = withAuth(Calendar);
const ProtectedTagCloud = withAuth(TagCloud);
const ProtectedProfile = withAuth(Profile);
const ProtectedNotesSplitView = withAuth(NotesSplitView);
const ProtectedNotesListView = withAuth(NotesListView);

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={ProtectedHome} />
      <Route path="/entry/:id" component={ProtectedEntryDetail} />
      <Route path="/calendar" component={ProtectedCalendar} />
      <Route path="/tags" component={ProtectedTagCloud} />
      <Route path="/profile" component={ProtectedProfile} />
      <Route path="/notes-split" component={ProtectedNotesSplitView} />
      <Route path="/notes-list" component={ProtectedNotesListView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
