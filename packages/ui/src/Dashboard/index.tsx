import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';

const Wrapper = styled.div`
  background: ${({ theme }) => theme.colors.gray[1]};
  overflow-wrap: break-word;
  min-height: 100%;
  height: auto !important; /* cross-browser */
  height: 100%; /* cross-browser */
  min-width: 740px;
  width: 100vw;

  display: grid;
  place-items: center;

  grid-template:
    [row1-start] 'sidebar content' 75px [row1-end]
    [row2-start] 'sidebar content' 1fr [row2-end]
    [row3-start] 'sidebar content' 75px [row3-end]
    / 200px 1fr;
  /* header content footer for column 2 when we add those in */
  place-items: stretch;

  @media print {
    & {
      grid-template:
        'content' 1fr
        / 1fr;
    }
  }
`;

const Sidebar = styled.div`
  grid-area: sidebar;
  background: ${({ theme }) => theme.colors.gray[0]};
  background-image: radial-gradient(
    circle at top center,
    ${({ theme }) => theme.colors.gray[0]} 0,
    transparent 20rem
  );
  backdrop-filter: brightness(102%) opacity(50%);
  border-right: 1px solid ${({ theme }) => theme.colors.gray[3]};
  box-shadow: 0px 0 15px 0px ${({ theme }) => theme.colors.subtleShadow};

  display: grid;
  grid-template:
    [row1-start] 'header' 75px [row1-end]
    [row2-start] 'content' 1fr [row2-end]
    [row3-start] '.' 75px [row3-end] / 100%;

  @media print {
    & {
      display: none;
    }
  }
`;

const SidebarHeader = styled.div`
  grid-area: header;
  padding: 0.25rem 1.5rem;
  user-select: none;
  pointer-events: none;

  display: flex;
  align-items: center;
  justify-content: start;

  .logo {
    width: 70%;
  }

  h1 {
    letter-spacing: 0.02em;
    font-weight: 800;
    font-size: 1.1em;
    width: fit-content;
    margin: 0;
    margin-top: 0.3rem;
    padding-right: 0.5rem; /* small padding for visual centering in sidebar */

    background: linear-gradient(
      335deg,
      hsla(6, 53%, 64%, 1) 40%,
      hsla(28, 74%, 68%, 1) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const SidebarContent = styled.div`
  grid-area: content;
`;

const Content = styled.div`
  grid-area: content;
  padding: 1.2rem 2rem; /* fix top and bottom padding when we add header in */
`;

const Header = styled.div`
  grid-area: header;
`;

const Footer = styled.div`
  grid-area: footer;
`;

type DashboardLayoutProps = {
  logo: React.ComponentType;
  children: React.ReactNode;
  sidebar: React.ReactNode;
};

// Same implementation explanation as `ExtensionLayout`
export const DashboardLayout = ({
  logo: Logo,
  children,
  sidebar,
}: DashboardLayoutProps) => {
  const { colors } = useTheme();
  return (
    <Wrapper>
      <Sidebar>
        <SidebarHeader>
          {/* @ts-ignore */}
          <Logo className="logo" fill={colors.logomark} />
        </SidebarHeader>

        <SidebarContent>{sidebar}</SidebarContent>
      </Sidebar>

      <Header />

      <Content>{children}</Content>

      <Footer />
    </Wrapper>
  );
};
