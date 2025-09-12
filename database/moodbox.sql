-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-09-2025 a las 18:59:33
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `moodbox`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_venta`
--

CREATE TABLE `detalle_venta` (
  `id_detalle` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL CHECK (`cantidad` > 0),
  `precio_unitario` decimal(10,2) NOT NULL CHECK (`precio_unitario` >= 0),
  `subtotal` decimal(10,2) NOT NULL CHECK (`subtotal` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalle_venta`
--

INSERT INTO `detalle_venta` (`id_detalle`, `id_venta`, `id_producto`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 1, 1, 1, 850.00, 850.00),
(2, 1, 2, 1, 25.99, 25.99),
(3, 2, 3, 1, 199.99, 199.99),
(4, 3, 4, 1, 70.00, 70.00),
(5, 5, 3, 1, 199.99, 199.99);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto`
--

CREATE TABLE `producto` (
  `id_producto` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL CHECK (`precio` >= 0),
  `stock` int(11) NOT NULL CHECK (`stock` >= 0),
  `categoria` varchar(100) DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `producto`
--

INSERT INTO `producto` (`id_producto`, `nombre`, `descripcion`, `precio`, `stock`, `categoria`, `estado`, `fecha_creacion`) VALUES
(1, 'Bolsa ecológica', 'Bolsa de tela reutilizable con logo personalizado', 5.99, 100, 'Merchandising', 'activo', '2025-09-12 11:56:28'),
(2, 'Mug corporativo', 'Taza de cerámica con impresión de logo a color', 8.50, 80, 'Merchandising', 'activo', '2025-09-12 11:56:28'),
(3, 'Agenda 2025', 'Agenda semanal con portada personalizada', 12.00, 60, 'Merchandising', 'activo', '2025-09-12 11:56:28'),
(4, 'Camiseta promocional', 'Camiseta de algodón estampada con logo', 10.00, 75, 'Merchandising', 'activo', '2025-09-12 11:56:28'),
(5, 'Llavero metálico', 'Llavero con forma del logo de la empresa', 3.50, 120, 'Merchandising', 'activo', '2025-09-12 11:56:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','cliente') DEFAULT 'cliente',
  `fecha_registro` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id_usuario`, `nombre`, `apellido`, `email`, `telefono`, `password`, `rol`, `fecha_registro`) VALUES
(1, 'Ana', 'Ramirez', 'ana.ramirez@example.com', '123456789', 'hashed_password_1', 'cliente', '2025-09-12 11:54:37'),
(2, 'Luis', 'Martinez', 'luis.martinez@example.com', '987654321', 'hashed_password_2', 'cliente', '2025-09-12 11:54:37'),
(3, 'Sofía', 'Gonzalez', 'sofia.gonzalez@example.com', '555123456', 'hashed_password_3', 'cliente', '2025-09-12 11:54:37'),
(4, 'Carlos', 'Lopez', 'carlos.lopez@example.com', '444555666', 'hashed_password_4', 'admin', '2025-09-12 11:54:37'),
(5, 'Lucía', 'Mendez', 'lucia.mendez@example.com', '321654987', 'hashed_password_5', 'cliente', '2025-09-12 11:54:37');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta`
--

CREATE TABLE `venta` (
  `id_venta` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `fecha_venta` datetime DEFAULT current_timestamp(),
  `total` decimal(10,2) NOT NULL CHECK (`total` >= 0),
  `estado` enum('pendiente','pagada','cancelada') DEFAULT 'pendiente',
  `metodo_pago` enum('tarjeta','efectivo','transferencia') DEFAULT 'efectivo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `venta`
--

INSERT INTO `venta` (`id_venta`, `id_usuario`, `fecha_venta`, `total`, `estado`, `metodo_pago`) VALUES
(1, 1, '2025-09-12 11:57:21', 875.99, 'pagada', 'tarjeta'),
(2, 2, '2025-09-12 11:57:21', 295.99, 'pendiente', 'efectivo'),
(3, 3, '2025-09-12 11:57:21', 70.00, 'pagada', 'transferencia'),
(4, 1, '2025-09-12 11:57:21', 225.99, 'cancelada', 'tarjeta'),
(5, 4, '2025-09-12 11:57:21', 199.99, 'pagada', 'efectivo');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `id_venta` (`id_venta`),
  ADD KEY `id_producto` (`id_producto`);

--
-- Indices de la tabla `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`id_producto`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `venta`
--
ALTER TABLE `venta`
  ADD PRIMARY KEY (`id_venta`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `venta`
--
ALTER TABLE `venta`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD CONSTRAINT `detalle_venta_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `venta` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `detalle_venta_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `venta`
--
ALTER TABLE `venta`
  ADD CONSTRAINT `venta_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
