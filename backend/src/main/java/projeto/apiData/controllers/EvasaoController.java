package projeto.apiData.controllers;

import projeto.apiData.dto.PontoCurva;
import projeto.apiData.dto.RankingItem;
import projeto.apiData.repositories.IndicadorTrajetoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import projeto.apiData.services.EvasaoAgregada;

import java.util.List;


@RestController
@RequestMapping("/evasao")
@RequiredArgsConstructor
public class EvasaoController {


    private final IndicadorTrajetoriaRepository repository;

    @GetMapping
    public EvasaoAgregada consultar(
            @RequestParam Integer area,
            @RequestParam Integer regiao,
            @RequestParam Integer coorte) {

        return repository.agregarEvasao(area, regiao, coorte);
    }

    @GetMapping("/curva")
    public List<PontoCurva> curva(@RequestParam Integer area,
                                  @RequestParam Integer regiao,
                                  @RequestParam Integer coorte) {
        return repository.curvaEvasao(area, regiao, coorte);
    }

    @GetMapping("/ranking")
    public List<RankingItem> ranking(@RequestParam Integer coorte) {
        return repository.rankingPorArea(coorte);
    }
}