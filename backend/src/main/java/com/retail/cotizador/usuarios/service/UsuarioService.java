package com.retail.cotizador.usuarios.service;

import com.retail.cotizador.common.exception.ResourceNotFoundException;
import com.retail.cotizador.usuarios.dto.UsuarioDto;
import com.retail.cotizador.usuarios.entity.Usuario;
import com.retail.cotizador.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<UsuarioDto> listarOBuscar(String query) {
        List<Usuario> list;
        if (query != null && !query.trim().isEmpty()) {
            list = usuarioRepository.buscarUsuarios(query.trim());
        } else {
            list = usuarioRepository.findByActivoTrueOrderByNombreCompletoAsc();
        }
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UsuarioDto obtenerPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));
        return mapToDto(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioDto obtenerPorUsername(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));
        return mapToDto(usuario);
    }

    @Transactional
    public UsuarioDto crear(UsuarioDto dto) {
        Usuario usuario = Usuario.builder()
                .username(dto.getUsername().trim().toUpperCase())
                .nombreCompleto(dto.getNombreCompleto().trim())
                .correo(dto.getCorreo())
                .cargo(dto.getCargo())
                .rol(dto.getRol() != null && !dto.getRol().trim().isEmpty() ? dto.getRol().trim() : "ROLE_VENTAS")
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                .build();

        return mapToDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDto actualizar(Long id, UsuarioDto dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));

        usuario.setUsername(dto.getUsername().trim().toUpperCase());
        usuario.setNombreCompleto(dto.getNombreCompleto().trim());
        usuario.setCorreo(dto.getCorreo());
        usuario.setCargo(dto.getCargo());
        if (dto.getRol() != null && !dto.getRol().trim().isEmpty()) {
            usuario.setRol(dto.getRol().trim());
        }
        if (dto.getActivo() != null) {
            usuario.setActivo(dto.getActivo());
        }

        return mapToDto(usuarioRepository.save(usuario));
    }

    private UsuarioDto mapToDto(Usuario entity) {
        return UsuarioDto.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .nombreCompleto(entity.getNombreCompleto())
                .correo(entity.getCorreo())
                .cargo(entity.getCargo())
                .rol(entity.getRol())
                .activo(entity.getActivo())
                .fechaCreacion(entity.getFechaCreacion())
                .build();
    }
}
