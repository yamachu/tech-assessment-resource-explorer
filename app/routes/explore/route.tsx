import { Outlet } from "@remix-run/react";
import {
  OwnerContextProvider,
  useOwner,
  useSetOwner,
} from "~/components/Context/OwnerContext";
import {
  RepositoryContextProvider,
  useRepository,
  useSetRepository,
} from "~/components/Context/RepositoryContext";
import {
  SelectedPathContextProvider,
  useSelectedPath,
  useSetSelectedPath,
} from "~/components/Context/SelectedPathContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  useSidebar,
} from "~/components/ui/sidebar";
import { useGitTree, useOwners, useRepositories } from "~/queries/hooks";
import type { Flatten } from "~/utils/types";

export default function Layout() {
  return (
    <OwnerContextProvider>
      <RepositoryContextProvider>
        <SelectedPathContextProvider>
          <SidebarProvider defaultOpen>
            <ResizableWrapped>
              <Outlet />
            </ResizableWrapped>
          </SidebarProvider>
        </SelectedPathContextProvider>
      </RepositoryContextProvider>
    </OwnerContextProvider>
  );
}

function ResizableWrapped({ children }: { children: React.ReactNode }) {
  const { setPanelWidth } = useSidebar();
  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(layouts) => {
        setPanelWidth(`${layouts[0]}%`);
      }}
    >
      <ResizablePanel defaultSize={25}>
        <TreeSidebar />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>{children}</ResizablePanel>
    </ResizablePanelGroup>
  );
}

// https://ui.shadcn.com/blocks
function TreeSidebar() {
  const setOwner = useSetOwner();
  const owner = useOwner();
  const setRepository = useSetRepository();
  const repository = useRepository();
  const owners = useOwners();
  const repositories = useRepositories(owner);
  const tree = useGitTree(owner, repository);

  return (
    <Sidebar>
      <SidebarContent className="mt-2">
        <Select onValueChange={(v) => setOwner(v)}>
          <SelectTrigger className="w-11/12 mx-auto">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            {/* TODO: Like Awaitable */}
            {owners.data?.map((owner) => (
              <SelectItem key={owner} value={owner}>
                {owner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => setRepository(v)} disabled={owner === ""}>
          <SelectTrigger className="w-11/12 mx-auto">
            <SelectValue placeholder="Repository" />
          </SelectTrigger>
          <SelectContent>
            {repositories.data?.map((repository) => (
              <SelectItem key={repository} value={repository}>
                {repository}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <SidebarGroup>
          <SidebarGroupLabel>Files / GitTree</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tree.data?.map((item) => (
                <Tree key={item.sha} item={item} parent={""} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function Tree({
  item,
  parent,
}: {
  item: Flatten<NonNullable<ReturnType<typeof useGitTree>["data"]>>;
  parent: string;
}) {
  const path = useSelectedPath();
  const setSelectedPath = useSetSelectedPath();
  if (!("children" in item)) {
    return (
      <SidebarMenuButton
        className="data-[active=true]:bg-transparent"
        value={[item.path, item.type]}
        isActive={path === item.path}
        onClick={(ev) => {
          if (ev.currentTarget.value.split(",")[1] === "blob") {
            setSelectedPath(ev.currentTarget.value.split(",")[0]);
          }
        }}
      >
        {item.path.replace(`${parent}/`, "")}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            {item.path.replace(`${parent}/`, "")}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((subItem) => (
              <Tree key={subItem.sha} item={subItem} parent={item.path} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
