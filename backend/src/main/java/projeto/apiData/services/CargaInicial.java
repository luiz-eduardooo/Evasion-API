package projeto.apiData.services;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import projeto.apiData.repositories.IndicadorTrajetoriaRepository;

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
        carregadorService.carregar("dados/trajetorias.csv");
        System.out.println(">> Carga concluída! Linhas no banco: " + repository.count());
    }
}