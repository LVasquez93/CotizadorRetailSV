package com.retail.cotizador.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioDto {
    private Long id;

    @NotBlank(message = "El código de usuario es obligatorio")
    private String username;

    @NotBlank(message = "El nombre completo es obligatorio")
    private String nombreCompleto;

    private String correo;
    private String cargo;
    private String rol;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
}
