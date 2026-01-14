package com.whatsappclone.signaling;

import com.whatsappclone.presence.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DiagnosticController {

    private final PresenceService presenceService;

    @GetMapping("/presence")
    public Map<String, String> getPresence() {
        return presenceService.getActiveUsers();
    }
}
