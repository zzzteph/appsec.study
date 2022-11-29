<?php

namespace App\View\Components;

use Illuminate\View\Component;

class LabTemplate extends Component
{
    /**
     * Create a new component instance.
     *
     * @return void
     */
	 public $templateCode;
    public function __construct($templateCode)
    {
        $this->templateCode = $templateCode;
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.lab-template');
    }
}
