import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Items from "@/pages/Items";
import ItemDetail from "@/pages/ItemDetail";
import ItemForm from "@/pages/ItemForm";
import Reports from "@/pages/Reports";
import Admin from "@/pages/Admin";
import UserForm from "@/pages/UserForm";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/items"} component={Items} />
      <Route path={"/items/new"} component={ItemForm} />
      <Route path={"/items/:id/edit"} component={ItemForm} />
      <Route path={"/items/:id"} component={ItemDetail} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/admin/users/new"} component={UserForm} />
      <Route path={"/"} component={Dashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
