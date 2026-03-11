/**
 * 🧭 Layout principal autenticado
 *
 * Proporciona la estructura compartida de navegación para todas las pantallas
 * internas del sistema.
 */
import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AppBar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { logout } from '../services/auth.service';
import { authStore } from '../store/auth.store';

const drawerWidth = 290;
const drawerCollapsedWidth = 92;

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const user = authStore.getUser();

  const items = useMemo(() => [
    { label: 'Dashboard', to: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Realizar encuesta', to: '/surveys/new', icon: <AssignmentIcon /> },
    { label: 'Encuestados', to: '/respondents', icon: <GroupIcon /> },
  ], []);

  // 📏 El ancho visible del menú depende del estado colapsado y del breakpoint.
  const currentWidth = collapsed && !isMobile ? drawerCollapsedWidth : drawerWidth;

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 🪪 Branding y datos del usuario */}
      <Box sx={{ p: 2.2, minHeight: 84 }}>
        {collapsed && !isMobile ? (
          <Stack alignItems="center" spacing={1}>
            <Tooltip title="Expandir menú">
              <IconButton onClick={() => setCollapsed(false)} color="primary"><ChevronRightIcon /></IconButton>
            </Tooltip>
            <Typography fontWeight={900}>CQ</Typography>
          </Stack>
        ) : (
          <Stack spacing={1.3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={900}>Contigo QROO</Typography>
                <Typography variant="caption" color="text.secondary">Plataforma de encuestas 🗳️</Typography>
              </Box>
              <IconButton onClick={() => (isMobile ? setMobileOpen(false) : setCollapsed(true))} color="primary"><ChevronLeftIcon /></IconButton>
            </Stack>
            {user && (
              <Box>
                <Typography variant="body2" fontWeight={800}>{user.nombre}</Typography>
                <Typography variant="caption" color="text.secondary">@{user.username}</Typography>
              </Box>
            )}
          </Stack>
        )}
      </Box>
      <Divider />
      {/* 🧭 Lista de accesos principales */}
      <List sx={{ flex: 1, p: 1.2 }}>
        {items.map((item) => {
          const button = (
            <ListItemButton key={item.to} component={NavLink} to={item.to} onClick={() => isMobile && setMobileOpen(false)} sx={{ borderRadius: 3, my: .5, minHeight: 48, justifyContent: collapsed && !isMobile ? 'center' : 'flex-start', '&.active': { bgcolor: 'rgba(108,56,65,0.12)', color: 'primary.main', '& .MuiListItemIcon-root': { color: 'primary.main' } } }}>
              <ListItemIcon sx={{ minWidth: collapsed && !isMobile ? 'auto' : 40, mr: collapsed && !isMobile ? 0 : .5 }}>{item.icon}</ListItemIcon>
              {!(collapsed && !isMobile) && <ListItemText primary={item.label} />}
            </ListItemButton>
          );
          return collapsed && !isMobile ? <Tooltip title={item.label} placement="right" key={item.to}>{button}</Tooltip> : button;
        })}
      </List>
      <Divider />
      {/* 🚪 Acción de cierre de sesión */}
      <Box sx={{ p: 1.5 }}>
        <Button fullWidth variant={collapsed && !isMobile ? 'text' : 'outlined'} color="inherit" startIcon={<LogoutIcon />} onClick={() => setLogoutOpen(true)} sx={{ justifyContent: collapsed && !isMobile ? 'center' : 'flex-start' }}>
          {!(collapsed && !isMobile) && 'Cerrar sesión'}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* 🪟 Barra superior fija */}
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.85)', color: 'text.primary', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(108,56,65,0.08)', width: { md: `calc(100% - ${currentWidth}px)` }, ml: { md: `${currentWidth}px` } }}>
        <Toolbar>
          <IconButton onClick={() => (isMobile ? setMobileOpen((s) => !s) : setCollapsed((s) => !s))} color="primary"><MenuIcon /></IconButton>
          <Typography sx={{ fontWeight: 900, ml: 1, flex: 1 }}>Encuestas ciudadanas · Contigo Quintana Roo</Typography>
        </Toolbar>
      </AppBar>
      {/* 📚 Drawer lateral, temporal en móvil y permanente en desktop */}
      <Box component="nav" sx={{ width: { md: currentWidth }, flexShrink: { md: 0 } }}>
        <Drawer variant={isMobile ? 'temporary' : 'permanent'} open={isMobile ? mobileOpen : true} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: currentWidth, transition: 'width .25s ease', borderRight: '1px solid rgba(108,56,65,0.08)', bgcolor: 'background.paper', overflowX: 'hidden' } }}>
          {content}
        </Drawer>
      </Box>
      {/* 🧩 Aquí se renderiza la ruta hija activa */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, mt: 8 }}>
        <Outlet />
      </Box>
      <ConfirmDialog open={logoutOpen} title="Cerrar sesión" content="¿Deseas salir de la plataforma?" confirmText="Salir" onClose={() => setLogoutOpen(false)} onConfirm={() => { logout(); navigate('/login', { replace: true }); }} />
    </Box>
  );
}
