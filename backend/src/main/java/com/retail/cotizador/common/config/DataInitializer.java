package com.retail.cotizador.common.config;

import com.retail.cotizador.clientes.entity.Cliente;
import com.retail.cotizador.clientes.repository.ClienteRepository;
import com.retail.cotizador.equipos.entity.Equipo;
import com.retail.cotizador.equipos.repository.EquipoRepository;
import com.retail.cotizador.usuarios.entity.Usuario;
import com.retail.cotizador.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final EquipoRepository equipoRepository;

    @Override
    public void run(String... args) {
        inicializarUsuarios();
        inicializarClientes();
        inicializarEquipos();
    }

    private void inicializarUsuarios() {
        if (usuarioRepository.count() == 0) {
            log.info("Cargando usuarios y emisores iniciales...");
            usuarioRepository.saveAll(List.of(
                    Usuario.builder()
                            .username("VENTASSR001")
                            .nombreCompleto("Ejecutivo Ventas Retail SV")
                            .cargo("Ejecutivo de Ventas")
                            .correo("ventas.sv@retail.com.gt")
                            .rol("ROLE_VENTAS")
                            .activo(true)
                            .build(),
                    Usuario.builder()
                            .username("ERAMIREZ")
                            .nombreCompleto("Ing. Erick Ramírez")
                            .cargo("Gerente General")
                            .correo("erick.ramirez@retail.com.gt")
                            .rol("ROLE_ADMIN")
                            .activo(true)
                            .build()
            ));
        }
    }

    private void inicializarClientes() {
        if (clienteRepository.count() == 0) {
            log.info("Cargando clientes iniciales...");
            clienteRepository.saveAll(List.of(
                    Cliente.builder()
                            .razonSocial("ALIMENTOS Y TURISMO SA DE CV")
                            .nombreComercial("PREMIUM RESTAURANTS")
                            .contactoPrincipal("Tania Argueta")
                            .telefono("2263-0000")
                            .correo("compras@premiumrestaurants.com")
                            .direccion("San Salvador, El Salvador")
                            .activo(true)
                            .build(),
                    Cliente.builder()
                            .razonSocial("SUPERMERCADOS DE CENTROAMERICA SA DE CV")
                            .nombreComercial("SUPER SELECTOS")
                            .contactoPrincipal("Carlos Mendoza")
                            .telefono("2288-5500")
                            .correo("adquisiciones@selectos.com.sv")
                            .direccion("Antiguo Cuscatlán, La Libertad")
                            .activo(true)
                            .build(),
                    Cliente.builder()
                            .razonSocial("DISTRIBUIDORA FARMACEUTICA SV SA DE CV")
                            .nombreComercial("FARMACIAS ECONOMICAS")
                            .contactoPrincipal("Lic. Roberto Gómez")
                            .telefono("2244-1122")
                            .correo("compras@farmaciaseconomicas.com.sv")
                            .direccion("San Salvador, El Salvador")
                            .activo(true)
                            .build()
            ));
        }
    }

    private void inicializarEquipos() {
        if (equipoRepository.count() == 0) {
            log.info("Cargando catálogo maestro inicial de equipos...");
            equipoRepository.saveAll(List.of(
                    Equipo.builder()
                            .descripcion("IMPRESORA DE TARJETAS ZEBRA ZC300 DUAL")
                            .partNumber("ZCD-800300-250LA")
                            .caracteristicas("• Sublimación directa a tarjeta\n• Impresión doble cara automática\n• Resolución 300 dpi\n• Conectividad USB y Ethernet")
                            .precioReferencial(new BigDecimal("1250.00"))
                            .tiempoEntregaPredeterminado("De 5 a 6 semanas")
                            .categoria("Impresoras de Tarjetas")
                            .activo(true)
                            .build(),
                    Equipo.builder()
                            .descripcion("IMPRESORA TERMICA INDUSTRIAL ZEBRA ZT411")
                            .partNumber("ZT41142-T010000Z")
                            .caracteristicas("• Impresión térmica directa y transferencia térmica\n• Ancho de impresión 4 pulgadas\n• Resolución 203 dpi\n• Pantalla táctil a color de 4.3 pulgadas\n• Puertos USB, Serial, Ethernet y Bluetooth")
                            .precioReferencial(new BigDecimal("1650.00"))
                            .tiempoEntregaPredeterminado("De 4 a 5 semanas")
                            .categoria("Impresoras Térmicas")
                            .activo(true)
                            .build(),
                    Equipo.builder()
                            .descripcion("TERMINAL PUNTO DE VENTA TOUCH ELO 15E3")
                            .partNumber("E001463")
                            .caracteristicas("• Pantalla táctil de 15.6 pulgadas antirreflejo\n• Procesador Intel Celeron J1900 Quad-Core\n• Memoria RAM 4GB DDR3L\n• Disco de estado sólido 128GB SSD\n• Sellado contra derrames y polvo")
                            .precioReferencial(new BigDecimal("890.00"))
                            .tiempoEntregaPredeterminado("De 3 a 4 semanas")
                            .categoria("Terminales POS")
                            .activo(true)
                            .build(),
                    Equipo.builder()
                            .descripcion("LECTOR DE CODIGO DE BARRAS 2D DATALOGIC QUICKSCAN QD2500")
                            .partNumber("QD2590-BKK1S")
                            .caracteristicas("• Tecnología de lectura óptica 2D Imager\n• Lectura de códigos 1D y 2D en pantallas de celulares\n• Puntero LED azul de alta precisión\n• Conectividad USB Plug & Play")
                            .precioReferencial(new BigDecimal("185.00"))
                            .tiempoEntregaPredeterminado("Stock Inmediato")
                            .categoria("Lectores de Código de Barras")
                            .activo(true)
                            .build(),
                    Equipo.builder()
                            .descripcion("COMPUTADORA MOVIL INDUSTRIAL HONEYWELL SCANPAL EDA52")
                            .partNumber("EDA52-111-E2101RK")
                            .caracteristicas("• Sistema Operativo Android 11 actualizable\n• Pantalla táctil Gorilla Glass de 5.5 pulgadas\n• Motor de escaneo 2D Honeywell S0703 integrado\n• Batería de 4500 mAh de larga duración\n• Conectividad Wi-Fi, 4G LTE y Bluetooth 5.1")
                            .precioReferencial(new BigDecimal("750.00"))
                            .tiempoEntregaPredeterminado("De 4 a 6 semanas")
                            .categoria("Computadoras Móviles")
                            .activo(true)
                            .build()
            ));
        }
    }
}
