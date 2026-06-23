package projeto.apiData.services;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import projeto.apiData.entities.IndicadorTrajetoria;
import projeto.apiData.repositories.IndicadorTrajetoriaRepository;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CarregadorService {

    private final IndicadorTrajetoriaRepository repository;

    public void carregar(String caminhoArquivo) throws Exception {
        List<IndicadorTrajetoria> lote = new ArrayList<>();

        try (CSVReader reader = new CSVReaderBuilder(
                Files.newBufferedReader(Path.of(caminhoArquivo), StandardCharsets.UTF_8))
                .withSkipLines(9)
                .withCSVParser(new CSVParserBuilder().withSeparator(';').build())
                .build()) {

            String[] campos;
            int contador = 0;
            while ((campos = reader.readNext()) != null) {
                if (contador < 3) {   // espia só as 3 primeiras linhas de dado
                    System.out.println("Colunas: " + campos.length + " | col[0]=[" + campos[0] + "]");
                    contador++;
                }
                if (campos.length < 29) continue;
                if (!campos[0].matches("\\d+")) continue;

                IndicadorTrajetoria ind = new IndicadorTrajetoria();

                ind.setCoIes(parseLong(campos[0]));
                ind.setNoIes(campos[1]);
                ind.setCoCurso(parseInt(campos[4]));
                ind.setNoCurso(campos[5]);

                ind.setTpCategoriaAdministrativa(parseInt(campos[2]));
                ind.setCoRegiao(parseInt(campos[6]));
                ind.setCoUf(parseInt(campos[7]));
                ind.setTpModalidadeEnsino(parseInt(campos[10]));
                ind.setCoCineAreaGeral(parseInt(campos[13]));
                ind.setNoCineAreaGeral(campos[14]);

                ind.setNuAnoIngresso(parseInt(campos[15]));
                ind.setNuAnoReferencia(parseInt(campos[16]));
                ind.setNuAnoMaximoAcompanhamento(parseInt(campos[20]));
                ind.setQtIngressante(parseInt(campos[21]));
                ind.setQtPermanencia(parseInt(campos[22]));
                ind.setQtConcluinte(parseInt(campos[23]));
                ind.setQtDesistencia(parseInt(campos[24]));
                ind.setQtFalecido(parseInt(campos[25]));

                ind.setTca(parseDouble(campos[27]));
                ind.setTda(parseDouble(campos[28]));

                lote.add(ind);
            }
        }

        repository.saveAll(lote);
    }


    private Integer parseInt(String valor) {
        if (valor == null || valor.isBlank()) return null;
        return Integer.valueOf(valor.trim());
    }

    private Long parseLong(String valor) {
        if (valor == null || valor.isBlank()) return null;
        return Long.valueOf(valor.trim());
    }

    private Double parseDouble(String valor) {
        if (valor == null || valor.isBlank()) return null;
        return Double.valueOf(valor.trim().replace(",", "."));   // "97,0" -> "97.0"
    }
}