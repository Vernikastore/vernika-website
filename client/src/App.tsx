import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import AdminLeads from "./pages/AdminLeads";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={Home} />
            <Route path="/services" component={Home} />
            <Route path="/application" component={Home} />
            <Route path="/case-studies" component={Home} />
            <Route path="/insights" component={Home} />
            <Route path="/insights/:slug" component={Home} />
            <Route path="/contact" component={Home} />
            <Route path="/admin" component={AdminLeads} />
            <Route path="/admin/leads" component={AdminLeads} />
            <Route path="/admin/consultations" component={AdminLeads} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
