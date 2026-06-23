package projeto.apiData.services;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import projeto.apiData.repositories.IndicadorTrajetoriaRepository;
import org.springframework.core.io.ClassPathResource;

@Component
@RequiredArgsConstructor
public class CargaInicial implements CommandLineRunner {

    private final CarregadorService carregadorService;
    private final IndicadorTrajetoriaRepository repository;

    @Override
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            System.out.println(">> Banco já populado, pulando carga.");
            return;
        }

        System.out.println(">> Iniciando carga do INEP...");
        var resource = new ClassPathResource("trajetorias.csv");
        carregadorService.carregar(resource.getInputStream());
        System.out.println(">> Carga concluída! Linhas no banco: " + repository.count());
    }
}