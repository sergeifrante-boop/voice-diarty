import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import EntryDetail from "@/pages/EntryDetail";
import Calendar from "@/pages/Calendar";
import TagCloud from "@/pages/TagCloud";
import Profile from "@/pages/Profile";
import NotesSplitView from "@/pages/NotesSplitView";
import NotesListView from "@/pages/NotesListView";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/entry/:id" component={EntryDetail} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/tags" component={TagCloud} />
      <Route path="/profile" component={Profile} />
      <Route path="/notes-split" component={NotesSplitView} />
      <Route path="/notes-list" component={NotesListView} />
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
